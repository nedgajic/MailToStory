import prisma from "@/lib/prisma";
import { normalizeEmail } from "@/lib/password";
import { notifyUnknownSender } from "@/lib/email/forwarding-address";
import { isInboundSenderAllowed } from "@/lib/inbound/sender-allowlist";
import {
  quarantineFieldsFromPayload,
  quarantineRowToPayload,
} from "@/lib/inbound/quarantine-payload";
import type { PostmarkInboundPayload } from "@/lib/inbound/postmark";
import type { WorkspaceContext } from "@/lib/session";
import { quarantineSenderFilter } from "@/lib/inbound/quarantine-access";

const DEFAULT_QUARANTINE_DAYS = 14;

function quarantineDays(): number {
  const parsed = Number(process.env.QUARANTINE_RETENTION_DAYS);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_QUARANTINE_DAYS;
  return Math.floor(parsed);
}

function quarantineExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + quarantineDays() * 24 * 60 * 60 * 1000);
}

export async function cleanupExpiredQuarantine(): Promise<number> {
  const result = await prisma.quarantinedInbound.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}

async function maybeCleanupExpiredQuarantine(): Promise<void> {
  try {
    await cleanupExpiredQuarantine();
  } catch (error) {
    console.error("[quarantine] cleanup failed", error);
  }
}

export async function quarantineInboundPayload(input: {
  workspaceId: string;
  workspaceName: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  messageDate: Date;
  payload: PostmarkInboundPayload;
}): Promise<{ id: string }> {
  const fromEmail = normalizeEmail(input.fromEmail);
  const fields = quarantineFieldsFromPayload(input.payload, {
    fromEmail,
    fromName: input.fromName,
    subject: input.subject,
    snippet: input.snippet,
    messageDate: input.messageDate,
  });

  const row = await prisma.quarantinedInbound.create({
    data: {
      workspaceId: input.workspaceId,
      fromEmail,
      fromName: fields.fromName,
      subject: fields.subject,
      snippet: fields.snippet,
      textBody: fields.textBody,
      htmlBody: fields.htmlBody,
      toAddresses: fields.toAddresses,
      messageDate: fields.messageDate,
      attachmentCount: fields.attachmentCount,
      postmarkMessageId: fields.postmarkMessageId,
      expiresAt: quarantineExpiresAt(),
    },
  });

  const notifyCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentNotice = await prisma.quarantinedInbound.findFirst({
    where: {
      workspaceId: input.workspaceId,
      fromEmail,
      notifiedAt: { gte: notifyCutoff },
      id: { not: row.id },
    },
    select: { id: true },
  });

  if (!recentNotice) {
    try {
      await notifyUnknownSender({
        workspaceId: input.workspaceId,
        workspaceName: input.workspaceName,
        fromEmail,
        subject: input.subject,
      });
      await prisma.quarantinedInbound.update({
        where: { id: row.id },
        data: { notifiedAt: new Date() },
      });
    } catch (error) {
      console.error("[quarantine] notify failed", error);
    }
  }

  return { id: row.id };
}

export async function countVisibleQuarantine(ctx: WorkspaceContext): Promise<number> {
  await maybeCleanupExpiredQuarantine();
  const filter = quarantineSenderFilter(ctx);
  if (filter.fromEmail === "__none__") return 0;
  return prisma.quarantinedInbound.count({
    where: {
      workspaceId: ctx.workspace.id,
      expiresAt: { gt: new Date() },
      ...(filter.fromEmail ? { fromEmail: filter.fromEmail } : {}),
    },
  });
}

export async function listActiveQuarantine(
  workspaceId: string,
  filter?: { fromEmail?: string },
) {
  await maybeCleanupExpiredQuarantine();
  const now = new Date();
  const fromEmail =
    filter?.fromEmail && filter.fromEmail !== "__none__"
      ? filter.fromEmail
      : undefined;

  if (filter?.fromEmail === "__none__") {
    return [];
  }

  return prisma.quarantinedInbound.findMany({
    where: {
      workspaceId,
      expiresAt: { gt: now },
      ...(fromEmail ? { fromEmail } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fromEmail: true,
      fromName: true,
      subject: true,
      snippet: true,
      attachmentCount: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

export async function rejectQuarantinedInbound(
  workspaceId: string,
  id: string,
): Promise<boolean> {
  const row = await prisma.quarantinedInbound.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });
  if (!row) return false;
  await prisma.quarantinedInbound.delete({ where: { id: row.id } });
  return true;
}

export async function rejectQuarantineForSender(
  workspaceId: string,
  fromEmail: string,
): Promise<number> {
  const normalized = normalizeEmail(fromEmail);
  const result = await prisma.quarantinedInbound.deleteMany({
    where: { workspaceId, fromEmail: normalized },
  });
  return result.count;
}

export async function fetchActiveQuarantineForSender(
  workspaceId: string,
  fromEmail: string,
) {
  const normalized = normalizeEmail(fromEmail);
  const now = new Date();
  return prisma.quarantinedInbound.findMany({
    where: {
      workspaceId,
      fromEmail: normalized,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function isSenderAllowedForWorkspace(
  workspaceId: string,
  fromEmail: string,
): Promise<boolean> {
  return isInboundSenderAllowed(workspaceId, fromEmail);
}

export function payloadFromQuarantineRow(row: {
  fromEmail: string;
  fromName: string;
  subject: string;
  textBody: string;
  htmlBody: string | null;
  toAddresses: string;
  messageDate: Date | null;
  postmarkMessageId: string | null;
}): PostmarkInboundPayload {
  return quarantineRowToPayload(row);
}
