import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import {
  allocateUniqueInboundLocalPart,
  isValidWorkspaceDisplayName,
} from "@/lib/inbound-local-part";

export function inboundDomain(): string {
  return (
    process.env.POSTMARK_INBOUND_DOMAIN?.trim() || "inbox.mailtostory.com"
  );
}

export function inboundAddress(localPart: string): string {
  return `${localPart}@${inboundDomain()}`;
}

async function isInboundLocalPartTaken(
  localPart: string,
  exceptWorkspaceId?: string,
): Promise<boolean> {
  const existing = await prisma.workspace.findFirst({
    where: {
      inboundLocalPart: localPart,
      ...(exceptWorkspaceId ? { NOT: { id: exceptWorkspaceId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function allocateInboundForDisplayName(
  displayName: string,
  exceptWorkspaceId?: string,
): Promise<string> {
  return allocateUniqueInboundLocalPart(displayName, (localPart) =>
    isInboundLocalPartTaken(localPart, exceptWorkspaceId),
  );
}

export async function updateWorkspaceIdentity(
  workspaceId: string,
  displayName: string,
): Promise<{ name: string; inboundLocalPart: string }> {
  const trimmed = displayName.trim();
  if (!isValidWorkspaceDisplayName(trimmed)) {
    throw new Error("INVALID_WORKSPACE_NAME");
  }
  const inboundLocalPart = await allocateInboundForDisplayName(trimmed, workspaceId);
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: trimmed, inboundLocalPart },
  });
  return { name: trimmed, inboundLocalPart };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newRawToken(): string {
  return randomBytes(32).toString("hex");
}

export async function ensureWorkspaceForUser(input: {
  userId: string;
  name?: string | null;
  email?: string | null;
}): Promise<string> {
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: input.userId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { activeWorkspaceId: existing.workspaceId },
    });
    return existing.workspaceId;
  }

  const label =
    input.name?.trim() ||
    input.email?.split("@")[0]?.trim() ||
    "My workspace";

  const inboundLocalPart = await allocateInboundForDisplayName(label);

  const workspace = await prisma.workspace.create({
    data: {
      name: label,
      plan: "free",
      inboundLocalPart,
      seatQuantity: 1,
      members: {
        create: {
          userId: input.userId,
          role: "owner",
          status: "active",
        },
      },
    },
  });
  await prisma.user.update({
    where: { id: input.userId },
    data: { activeWorkspaceId: workspace.id },
  });
  return workspace.id;
}

export function utcMonthRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return { start, end };
}
