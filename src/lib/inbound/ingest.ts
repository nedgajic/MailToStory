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
import {
  evaluateGenerationGate,
  logStoryGeneration,
} from "@/lib/billing/generation-limits";
import { parsePlanId } from "@/lib/billing/plans";
import { notifyStoryReady } from "@/lib/email/story-notifications";
import {
  notifyGenerationFailed,
  notifyGenerationSkipped,
} from "@/lib/email/generation-notifications";
import { isInboundSenderAllowed } from "@/lib/inbound/sender-allowlist";
import { quarantineInboundPayload, payloadFromQuarantineRow } from "@/lib/inbound/quarantine";
import { enqueueBackgroundJob } from "@/lib/inbound/release-queue";
import {
  extractLocalParts,
  headerValue,
  senderFromPayload,
  type PostmarkInboundPayload,
} from "@/lib/inbound/postmark";
import {
  findConversationForInbound,
  formatSkippedAttachmentsNote,
} from "@/lib/inbound/conversation-lookup";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function storySearchText(digest: Digest, subject: string): string {
  const people = digest.participants
    .map((p) => `${p.name} ${p.email}`)
    .join(" ");
  return [digest.title, subject, digest.resolution_summary, people]
    .join(" ")
    .toLowerCase();
}

export type IngestResult =
  | { ok: true; conversationId?: string; quarantined?: boolean }
  | { ok: false; reason: string };

export async function ingestPostmarkPayload(
  payload: PostmarkInboundPayload,
): Promise<IngestResult> {
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

  const messageId = payload.MessageID?.trim() || null;
  if (messageId) {
    const dup = await prisma.conversationMessage.findUnique({
      where: { postmarkMessageId: messageId },
    });
    if (dup) return { ok: true, conversationId: dup.conversationId };

    const dupQuarantine = await prisma.quarantinedInbound.findUnique({
      where: { postmarkMessageId: messageId },
    });
    if (dupQuarantine) return { ok: true, quarantined: true };
  }

  const subject = payload.Subject?.trim() || "(no subject)";
  const sender = senderFromPayload(payload);
  const { name: fromName, email: fromEmail } = parseFromHeader(sender);
  const dateRaw = payload.Date || headerValue(payload, "Date");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const text = payload.TextBody?.trim() || "";

  const senderAllowed = await isInboundSenderAllowed(workspace.id, fromEmail);
  if (!senderAllowed) {
    await quarantineInboundPayload({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      fromEmail,
      fromName,
      subject,
      snippet: text.slice(0, 180),
      messageDate: safeDate,
      payload,
    });
    console.info("[inbound] quarantined unknown sender", {
      workspaceId: workspace.id,
      fromEmail,
    });
    return { ok: true, quarantined: true };
  }

  const conversationId = await ingestAllowedPostmarkPayload({
    payload,
    workspace,
    fromEmail,
  });
  return { ok: true, conversationId };
}

/** Process mail from an already-allowed sender into conversations + optional story. */
export async function ingestAllowedPostmarkPayload(input: {
  payload: PostmarkInboundPayload;
  workspace: {
    id: string;
    plan: string;
    seatQuantity: number;
  };
  fromEmail: string;
}): Promise<string> {
  const { payload, workspace, fromEmail } = input;

  const messageId = payload.MessageID?.trim();
  if (messageId) {
    const dup = await prisma.conversationMessage.findUnique({
      where: { postmarkMessageId: messageId },
    });
    if (dup) return dup.conversationId;
  }

  const subject = payload.Subject?.trim() || "(no subject)";
  const stripped = stripSubjectPrefix(subject);
  const sender = senderFromPayload(payload);
  const { name: fromName } = parseFromHeader(sender);
  const dateRaw = payload.Date || headerValue(payload, "Date");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const text = payload.TextBody?.trim() || "";
  const html = payload.HtmlBody?.trim() || null;

  let conversation = await findConversationForInbound({
    workspaceId: workspace.id,
    payload,
    strippedSubject: stripped,
    fromEmail,
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        subject: stripped || subject,
        snippet: text.slice(0, 180),
        lastMessageAt: safeDate,
      },
      select: { id: true, subject: true, snippet: true },
    });
  }

  const inReplyTo = headerValue(payload, "In-Reply-To");

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

  const dir = path.join(uploadRoot(), workspace.id, conversation.id);
  await mkdir(dir, { recursive: true });

  const skippedAttachments: string[] = [];
  for (const att of payload.Attachments ?? []) {
    const filename = (att.Name || "attachment").replace(/[/\\]/g, "_");
    const size = att.ContentLength ?? 0;
    if (size > MAX_ATTACHMENT_BYTES) {
      skippedAttachments.push(filename);
      continue;
    }
    const content = att.Content;
    if (!content) continue;
    const buf = Buffer.from(content, "base64");
    if (buf.length > MAX_ATTACHMENT_BYTES) {
      skippedAttachments.push(filename);
      continue;
    }
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
  }

  if (skippedAttachments.length > 0) {
    console.info("[inbound] attachments skipped", {
      workspaceId: workspace.id,
      conversationId: conversation.id,
      skippedAttachments,
    });
  }

  const attachmentNote = formatSkippedAttachmentsNote(skippedAttachments);

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      snippet: text.slice(0, 180) || conversation.snippet || "",
      lastMessageAt: safeDate,
      subject: stripped || conversation.subject,
    },
  });

  const existingStory = await prisma.story.findUnique({
    where: { conversationId: conversation.id },
    select: { id: true },
  });

  const gate = await evaluateGenerationGate({
    plan: parsePlanId(workspace.plan),
    workspaceId: workspace.id,
    conversationId: conversation.id,
    seatQuantity: workspace.seatQuantity,
    hasExistingStory: Boolean(existingStory),
    fromEmail,
  });
  if (!gate.allowed) {
    console.info("[inbound] generation skipped", {
      workspaceId: workspace.id,
      conversationId: conversation.id,
      reason: gate.reason,
    });
    if (gate.reason) {
      void notifyGenerationSkipped({
        workspaceId: workspace.id,
        conversationId: conversation.id,
        subject: conversation.subject,
        fromEmail,
        reason: gate.reason,
        message: gate.message ?? "Story generation was skipped.",
        attachmentNote,
      });
    }
    return conversation.id;
  }

  try {
    await generateAndSaveStory(conversation.id);
  } catch (error) {
    console.error("[inbound] digest failed", error);
    void notifyGenerationFailed({
      workspaceId: workspace.id,
      conversationId: conversation.id,
      subject: conversation.subject,
      fromEmail,
      attachmentNote,
    });
  }

  return conversation.id;
}

export async function releaseQuarantineForSender(input: {
  workspaceId: string;
  fromEmail: string;
}): Promise<number> {
  return releaseQuarantineForSenderSync(input);
}

/** Schedule background release so HTTP handlers return quickly under bulk approval. */
export async function scheduleReleaseQuarantineForSender(input: {
  workspaceId: string;
  fromEmail: string;
}): Promise<number> {
  const normalized = input.fromEmail.trim().toLowerCase();
  const pending = await prisma.quarantinedInbound.count({
    where: {
      workspaceId: input.workspaceId,
      fromEmail: normalized,
      expiresAt: { gt: new Date() },
    },
  });
  if (pending === 0) return 0;

  enqueueBackgroundJob(async () => {
    await releaseQuarantineForSenderSync({
      workspaceId: input.workspaceId,
      fromEmail: normalized,
    });
  });
  return pending;
}

async function releaseQuarantineForSenderSync(input: {
  workspaceId: string;
  fromEmail: string;
}): Promise<number> {
  const rows = await prisma.quarantinedInbound.findMany({
    where: {
      workspaceId: input.workspaceId,
      fromEmail: input.fromEmail.trim().toLowerCase(),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) return 0;

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: input.workspaceId },
    select: { id: true, plan: true, seatQuantity: true },
  });

  let processed = 0;
  for (const row of rows) {
    try {
      await ingestAllowedPostmarkPayload({
        payload: payloadFromQuarantineRow(row),
        workspace,
        fromEmail: row.fromEmail,
      });
      await prisma.quarantinedInbound.delete({ where: { id: row.id } });
      processed += 1;
    } catch (error) {
      console.error("[quarantine] release failed", {
        quarantineId: row.id,
        error,
      });
    }
  }
  return processed;
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

  const savedStory = await prisma.story.findUniqueOrThrow({
    where: { conversationId },
    select: { id: true },
  });

  try {
    await notifyStoryReady(savedStory.id);
  } catch (error) {
    console.error("[story] notify failed", error);
  }

  await logStoryGeneration({
    workspaceId: conversation.workspaceId,
    conversationId,
  });

  return digest;
}
