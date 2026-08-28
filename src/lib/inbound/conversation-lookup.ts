import prisma from "@/lib/prisma";
import type { PostmarkInboundPayload } from "@/lib/inbound/postmark";
import { headerValue } from "@/lib/inbound/postmark";
import {
  referencedMessageIds,
  subjectThreadCutoff,
} from "@/lib/inbound/threading";

export async function findConversationForInbound(input: {
  workspaceId: string;
  payload: PostmarkInboundPayload;
  strippedSubject: string;
  fromEmail: string;
}): Promise<{ id: string; subject: string; snippet: string | null } | null> {
  const inReplyTo = headerValue(input.payload, "In-Reply-To");

  if (inReplyTo) {
    const byReply = await prisma.conversation.findFirst({
      where: {
        workspaceId: input.workspaceId,
        messages: { some: { postmarkMessageId: inReplyTo } },
      },
      select: { id: true, subject: true, snippet: true },
    });
    if (byReply) return byReply;
  }

  const refIds = referencedMessageIds(input.payload);
  if (refIds.length > 0) {
    const byReferences = await prisma.conversation.findFirst({
      where: {
        workspaceId: input.workspaceId,
        messages: { some: { postmarkMessageId: { in: refIds } } },
      },
      orderBy: { lastMessageAt: "desc" },
      select: { id: true, subject: true, snippet: true },
    });
    if (byReferences) return byReferences;
  }

  if (!input.strippedSubject) return null;

  const normalizedFrom = input.fromEmail.trim().toLowerCase();
  return prisma.conversation.findFirst({
    where: {
      workspaceId: input.workspaceId,
      subject: { equals: input.strippedSubject, mode: "insensitive" },
      lastMessageAt: { gte: subjectThreadCutoff() },
      messages: {
        some: { fromEmail: { equals: normalizedFrom, mode: "insensitive" } },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true, subject: true, snippet: true },
  });
}

export type SkippedAttachmentReason = "size" | "blocked" | "malware";

export function formatSkippedAttachmentsNote(
  skipped: Array<{ filename: string; reason: SkippedAttachmentReason }>,
): string | null {
  if (skipped.length === 0) return null;
  const size = skipped.filter((item) => item.reason === "size").map((item) => item.filename);
  const blocked = skipped.filter((item) => item.reason === "blocked").map((item) => item.filename);
  const malware = skipped.filter((item) => item.reason === "malware").map((item) => item.filename);
  const parts: string[] = [];
  if (size.length > 0) {
    const listed = size.slice(0, 5).join(", ");
    const extra = size.length > 5 ? ` (+${size.length - 5} more)` : "";
    parts.push(
      `Some attachments were not stored because they exceed the 10 MB limit: ${listed}${extra}.`,
    );
  }
  if (blocked.length > 0) {
    const listed = blocked.slice(0, 5).join(", ");
    const extra = blocked.length > 5 ? ` (+${blocked.length - 5} more)` : "";
    parts.push(`Some attachments were blocked for security (${listed}${extra}).`);
  }
  if (malware.length > 0) {
    const listed = malware.slice(0, 5).join(", ");
    const extra = malware.length > 5 ? ` (+${malware.length - 5} more)` : "";
    parts.push(`Some attachments failed our security scan (${listed}${extra}).`);
  }
  return parts.join(" ");
}
