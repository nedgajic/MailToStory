import prisma from "@/lib/prisma";
import { normalizeEmail } from "@/lib/password";

export function isSenderInAllowlist(
  fromEmail: string,
  allowedEmails: string[],
): boolean {
  const normalized = normalizeEmail(fromEmail);
  if (!normalized) return false;
  return allowedEmails.includes(normalized);
}

/** Verified member account emails for a workspace. */
export async function verifiedMemberEmails(
  workspaceId: string,
): Promise<string[]> {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      status: "active",
      user: { emailVerified: { not: null } },
    },
    select: { user: { select: { email: true } } },
  });
  return [
    ...new Set(
      members
        .map((member) => normalizeEmail(member.user.email ?? ""))
        .filter(Boolean),
    ),
  ];
}

/** User-added forwarding addresses that completed email verification. */
export async function verifiedForwardingEmails(
  workspaceId: string,
): Promise<string[]> {
  const rows = await prisma.forwardingAddress.findMany({
    where: { workspaceId, verifiedAt: { not: null } },
    select: { email: true },
  });
  return [...new Set(rows.map((row) => normalizeEmail(row.email)).filter(Boolean))];
}

export async function workspaceAllowedSenderEmails(
  workspaceId: string,
): Promise<string[]> {
  const [members, forwarding] = await Promise.all([
    verifiedMemberEmails(workspaceId),
    verifiedForwardingEmails(workspaceId),
  ]);
  return [...new Set([...members, ...forwarding])];
}

export async function isInboundSenderAllowed(
  workspaceId: string,
  fromEmail: string,
): Promise<boolean> {
  const allowed = await workspaceAllowedSenderEmails(workspaceId);
  return isSenderInAllowlist(fromEmail, allowed);
}

export async function isMemberAccountEmail(
  workspaceId: string,
  email: string,
): Promise<boolean> {
  const members = await verifiedMemberEmails(workspaceId);
  return isSenderInAllowlist(email, members);
}
