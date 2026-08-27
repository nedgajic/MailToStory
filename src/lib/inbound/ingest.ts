import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma";
import { uploadRoot } from "@/lib/inbound/storage";
import { digestSchema, type Digest } from "@/lib/digest-schema";
import { parseFromHeader } from "@/lib/parseFromHeader";
import {
  parseForwardedThread,
  preprocessMessages,
  stripSubjectPrefix,
  type GenericMessage,
} from "@/lib/preprocessThread";
import { buildDigestPrompt } from "@/lib/buildDigestPrompt";
import { generateDigestFromPrompt } from "@/lib/gemini";
import { canGenerateStory } from "@/lib/billing/entitlements";
import { parsePlanId } from "@/lib/billing/plans";
import {
  extractLocalParts,
  headerValue,
  senderFromPayload,
  type PostmarkInboundPayload,
} from "@/lib/inbound/postmark";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function storySearchText(digest: Digest, subject: string): string {
  const people = digest.participants
    .map((p) => `${p.name} ${p.email}`)
    .join(" ");
  return [digest.title, subject, digest.resolution_summary, people]
    .join(" ")
    .toLowerCase();
}

export async function ingestPostmarkPayload(
  payload: PostmarkInboundPayload,
): Promise<{ ok: true; conversationId?: string } | { ok: false; reason: string }> {
  const locals = extractLocalParts(payload);
  if (locals.length === 0) {
    return { ok: false, reason: "no_inbound_recipient" };
  }

  const workspace = await prisma.workspace.findFirst({
    where: { inboundLocalPart: { in: locals } },
  });
  if (!workspace) {
    return { ok: false, reason: "unknown_address" };
  }

  const messageId = payload.MessageID?.trim();
  if (messageId) {
    const dup = await prisma.conversationMessage.findUnique({
      where: { postmarkMessageId: messageId },
    });
    if (dup) return { ok: true, conversationId: dup.conversationId };
  }

  const subject = payload.Subject?.trim() || "(no subject)";
  const stripped = stripSubjectPrefix(subject);
  const sender = senderFromPayload(payload);
  const { name: fromName, email: fromEmail } = parseFromHeader(sender);
  const dateRaw = payload.Date || headerValue(payload, "Date");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const text = payload.TextBody?.trim() || "";
  const html = payload.HtmlBody?.trim() || null;
  const inReplyTo = headerValue(payload, "In-Reply-To");

  let conversation = inReplyTo
    ? await prisma.conversation.findFirst({
        where: {
          workspaceId: workspace.id,
          messages: { some: { postmarkMessageId: inReplyTo } },
        },
      })
    : null;

  if (!conversation && stripped) {
    conversation = await prisma.conversation.findFirst({
      where: {
        workspaceId: workspace.id,
        subject: { equals: stripped, mode: "insensitive" },
      },
      orderBy: { lastMessageAt: "desc" },
    });
  }

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        subject: stripped || subject,
        snippet: text.slice(0, 180),
        lastMessageAt: safeDate,
      },
    });
  }

  const last = await prisma.conversationMessage.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  const nextSeq = (last?.sequence ?? 0) + 1;

  const stored = await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      sequence: nextSeq,
      fromName,
      fromEmail,
      toAddresses: payload.To ?? "",
      subject,
      date: safeDate,
      textBody: text,
      htmlBody: html,
      headersJson: payload.Headers ?? undefined,
      postmarkMessageId: messageId || null,
      inReplyTo: inReplyTo || null,
    },
  });

  const attachmentIds: Array<{ filename: string; mimeType: string; id: string }> =
    [];
  const dir = path.join(uploadRoot(), workspace.id, conversation.id);
  await mkdir(dir, { recursive: true });

  for (const att of payload.Attachments ?? []) {
    const filename = (att.Name || "attachment").replace(/[/\\]/g, "_");
    const size = att.ContentLength ?? 0;
    if (size > MAX_ATTACHMENT_BYTES) continue;
    const content = att.Content;
    if (!content) continue;
    const buf = Buffer.from(content, "base64");
    if (buf.length > MAX_ATTACHMENT_BYTES) continue;
    const row = await prisma.conversationAttachment.create({
      data: {
        conversationId: conversation.id,
        messageId: stored.id,
        filename,
        mimeType: att.ContentType || "application/octet-stream",
        size: buf.length,
        storagePath: "",
      },
    });
    const storagePath = path.join(dir, `${row.id}-${filename}`);
    await writeFile(storagePath, buf);
    await prisma.conversationAttachment.update({
      where: { id: row.id },
      data: { storagePath },
    });
    attachmentIds.push({
      filename,
      mimeType: att.ContentType || "application/octet-stream",
      id: row.id,
    });
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      snippet: text.slice(0, 180) || conversation.snippet,
      lastMessageAt: safeDate,
      subject: stripped || conversation.subject,
    },
  });

  const quota = await canGenerateStory(
    parsePlanId(workspace.plan),
    workspace.id,
  );
  if (!quota.allowed) {
    return { ok: true, conversationId: conversation.id };
  }

  const existingStory = await prisma.story.findUnique({
    where: { conversationId: conversation.id },
  });
  if (existingStory && nextSeq > 1) {
    // Follow-up: regenerate
  }

  try {
    await generateAndSaveStory(conversation.id);
  } catch (error) {
    console.error("[inbound] digest failed", error);
  }

  return { ok: true, conversationId: conversation.id };
}

export async function generateAndSaveStory(conversationId: string): Promise<Digest> {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { sequence: "asc" } },
      attachments: true,
      workspace: { select: { id: true, plan: true } },
    },
  });

  const latest = conversation.messages[conversation.messages.length - 1];
  const looksForwarded =
    conversation.messages.length === 1 &&
    /^(fwd|fw):/i.test(latest?.subject ?? "");

  let generics: GenericMessage[];
  if (looksForwarded && latest) {
    generics = parseForwardedThread(
      latest.textBody,
      `${latest.fromName} <${latest.fromEmail}>`.trim(),
      latest.date.toISOString(),
      latest.subject,
    ).map((m, i) => ({
      ...m,
      id: conversation.messages[i]?.id ?? m.id,
      attachments:
        i === 0
          ? conversation.attachments
              .filter((a) => a.messageId === latest.id)
              .map((a) => ({
                filename: a.filename,
                mimeType: a.mimeType,
                id: a.id,
              }))
          : [],
    }));
  } else {
    generics = conversation.messages.map((m) => ({
      id: m.id,
      from: m.fromName ? `${m.fromName} <${m.fromEmail}>` : m.fromEmail,
      date: m.date.toISOString(),
      subject: m.subject,
      text: m.textBody,
      html: m.htmlBody,
      attachments: conversation.attachments
        .filter((a) => a.messageId === m.id)
        .map((a) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          id: a.id,
        })),
    }));
  }

  const { cleanedThread, attachmentManifest, metadata } =
    preprocessMessages(generics);
  const prompt = buildDigestPrompt(
    cleanedThread,
    attachmentManifest,
    metadata,
  );
  const digest = digestSchema.parse(await generateDigestFromPrompt(prompt));
  const messageIdsInOrder = conversation.messages.map((m) => m.id);
  const searchText = storySearchText(digest, conversation.subject);

  await prisma.story.upsert({
    where: { conversationId },
    create: {
      conversationId,
      workspaceId: conversation.workspaceId,
      title: digest.title,
      subject: conversation.subject,
      status: digest.status,
      resolutionSummary: digest.resolution_summary,
      searchText,
      digest: JSON.parse(JSON.stringify(digest)),
      messageIdsInOrder: JSON.parse(JSON.stringify(messageIdsInOrder)),
    },
    update: {
      title: digest.title,
      subject: conversation.subject,
      status: digest.status,
      resolutionSummary: digest.resolution_summary,
      searchText,
      digest: JSON.parse(JSON.stringify(digest)),
      messageIdsInOrder: JSON.parse(JSON.stringify(messageIdsInOrder)),
    },
  });

  return digest;
}
