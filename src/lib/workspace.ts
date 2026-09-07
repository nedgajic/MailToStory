import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import {
  allocateUniqueInboundLocalPart,
  isValidWorkspaceDisplayName,
  validateInboundLocalPart,
} from "@/lib/inbound-local-part";
import { inboundAddress, inboundDomain } from "@/lib/inbound-domain";

export { inboundAddress, inboundDomain };

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

/** Update display name only — shared inbox address is never changed. */
export async function updateWorkspaceName(
  workspaceId: string,
  displayName: string,
): Promise<{ name: string; inboundLocalPart: string }> {
  const trimmed = displayName.trim();
  if (!isValidWorkspaceDisplayName(trimmed)) {
    throw new Error("INVALID_WORKSPACE_NAME");
  }
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: trimmed },
    select: { name: true, inboundLocalPart: true },
  });
}

/** First-time Team setup: set team name and claim a permanent shared inbox slug. */
export async function setupTeamWorkspace(
  workspaceId: string,
  input: { teamName: string; inboxSlug: string },
): Promise<{ name: string; inboundLocalPart: string }> {
  const teamName = input.teamName.trim();
  if (!isValidWorkspaceDisplayName(teamName)) {
    throw new Error("INVALID_WORKSPACE_NAME");
  }

  const validation = validateInboundLocalPart(input.inboxSlug);
  if (!validation.ok) {
    throw new Error(validation.code);
  }

  if (await isInboundLocalPartTaken(validation.slug, workspaceId)) {
    throw new Error("INBOX_SLUG_TAKEN");
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: teamName, inboundLocalPart: validation.slug },
    select: { name: true, inboundLocalPart: true },
  });
}

export function teamWorkspaceErrorMessage(code: string): string {
  switch (code) {
    case "INVALID_WORKSPACE_NAME":
      return "Use at least 2 letters or numbers for the team name.";
    case "INVALID_INBOX_SLUG":
      return "Inbox address must be 2–48 letters or numbers (hyphens allowed).";
    case "RESERVED_INBOX_SLUG":
      return "That inbox address is reserved. Choose another.";
    case "INBOX_SLUG_TAKEN":
      return "That inbox address is already taken. Choose another.";
    default:
      return "Could not save team settings.";
  }
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
