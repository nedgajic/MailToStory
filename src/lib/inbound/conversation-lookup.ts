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

export function formatSkippedAttachmentsNote(filenames: string[]): string | null {
  if (filenames.length === 0) return null;
  const listed = filenames.slice(0, 5).join(", ");
  const extra =
    filenames.length > 5 ? ` (+${filenames.length - 5} more)` : "";
  return `Some attachments were not stored because they exceed the 10 MB limit: ${listed}${extra}.`;
}
