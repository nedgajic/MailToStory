import prisma from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/password";
import { appUrl, sendTransactionalEmail } from "@/lib/email/send";
import { hashToken, newRawToken } from "@/lib/workspace";
import { BRAND_NAME } from "@/lib/brand";
import { isMemberAccountEmail } from "@/lib/inbound/sender-allowlist";

const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function forwardingTokenIdentifier(
  workspaceId: string,
  email: string,
): string {
  return `forward:${workspaceId}:${normalizeEmail(email)}`;
}

export async function sendForwardingAddressVerification(input: {
  workspaceId: string;
  email: string;
  workspaceName: string;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }

  const raw = newRawToken();
  const identifier = forwardingTokenIdentifier(input.workspaceId, email);
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(raw),
      expires: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  const url = appUrl(
    `/verify-forwarding?token=${encodeURIComponent(raw)}&workspace=${encodeURIComponent(input.workspaceId)}`,
  );
  await sendTransactionalEmail({
    to: email,
    subject: `Confirm forwarding address for ${input.workspaceName}`,
    text: [
      `Someone requested to forward mail to ${input.workspaceName} on ${BRAND_NAME} from ${email}.`,
      "",
      "Confirm this address to allow story generation from it:",
      url,
      "",
      "If you did not request this, ignore this message.",
    ].join("\n"),
  });
}

export async function resendForwardingAddressVerification(input: {
  workspaceId: string;
  email: string;
  workspaceName: string;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  const row = await prisma.forwardingAddress.findUnique({
    where: {
      workspaceId_email: { workspaceId: input.workspaceId, email },
    },
  });
  if (!row) throw new Error("NOT_FOUND");
  if (row.verifiedAt) throw new Error("ALREADY_VERIFIED");
  await sendForwardingAddressVerification(input);
}

export async function requestForwardingAddressVerification(input: {
  workspaceId: string;
  email: string;
  addedById: string;
  workspaceName: string;
}): Promise<{ email: string; pending: boolean }> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }

  if (await isMemberAccountEmail(input.workspaceId, email)) {
    throw new Error("ALREADY_MEMBER_EMAIL");
  }

  const existing = await prisma.forwardingAddress.findUnique({
    where: {
      workspaceId_email: { workspaceId: input.workspaceId, email },
    },
  });
  if (existing?.verifiedAt) {
    return { email, pending: false };
  }

  await prisma.forwardingAddress.upsert({
    where: {
      workspaceId_email: { workspaceId: input.workspaceId, email },
    },
    create: {
      workspaceId: input.workspaceId,
      email,
      addedById: input.addedById,
    },
    update: { addedById: input.addedById },
  });

  await sendForwardingAddressVerification({
    workspaceId: input.workspaceId,
    email,
    workspaceName: input.workspaceName,
  });

  return { email, pending: true };
}

/**
 * Trust an authenticated workspace admin approving held mail: mark the sender
 * verified without sending a confirmation email (outbound may be unavailable).
 */
export async function approveForwardingSenderFromQuarantine(input: {
  workspaceId: string;
  email: string;
  addedById: string;
}): Promise<{ email: string }> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }

  if (await isMemberAccountEmail(input.workspaceId, email)) {
    throw new Error("ALREADY_MEMBER_EMAIL");
  }

  const verifiedAt = new Date();
  await prisma.forwardingAddress.upsert({
    where: {
      workspaceId_email: { workspaceId: input.workspaceId, email },
    },
    create: {
      workspaceId: input.workspaceId,
      email,
      addedById: input.addedById,
      verifiedAt,
    },
    update: {
      addedById: input.addedById,
      verifiedAt,
    },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: forwardingTokenIdentifier(input.workspaceId, email) },
  });

  return { email };
}

export async function verifyForwardingAddressToken(input: {
  rawToken: string;
  workspaceId: string;
}): Promise<{ email: string } | null> {
  const hashed = hashToken(input.rawToken);
  const identifierPrefix = `forward:${input.workspaceId}:`;
  const row = await prisma.verificationToken.findFirst({
    where: {
      token: hashed,
      expires: { gt: new Date() },
      identifier: { startsWith: identifierPrefix },
    },
  });
  if (!row) return null;

  const email = row.identifier.slice(identifierPrefix.length);
  if (!email) return null;

  await prisma.forwardingAddress.updateMany({
    where: { workspaceId: input.workspaceId, email },
    data: { verifiedAt: new Date() },
  });
  await prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } });

  return { email };
}

export async function notifyUnknownSender(input: {
  workspaceId: string;
  workspaceName: string;
  fromEmail: string;
  subject: string;
}): Promise<void> {
  const normalizedFrom = normalizeEmail(input.fromEmail);
  const settingsUrl = appUrl("/settings/email#forwarding");
  const text = [
    `Mail arrived at ${input.workspaceName} from an unverified address: ${input.fromEmail}`,
    "",
    `Subject: ${input.subject}`,
    "",
    "Approve this forwarding address in Settings to generate a story:",
    settingsUrl,
    "",
    "The message was held temporarily and was not stored in your stories inbox.",
  ].join("\n");

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: input.workspaceId,
      status: "active",
      user: { emailVerified: { not: null }, email: { not: null } },
    },
    select: {
      role: true,
      user: { select: { email: true } },
    },
  });

  const recipients = new Set<string>();
  for (const member of members) {
    const to = member.user.email;
    if (!to) continue;
    const isAdmin = member.role === "owner" || member.role === "admin";
    const isSelf = normalizeEmail(to) === normalizedFrom;
    if (isAdmin || isSelf) recipients.add(to);
  }

  for (const to of recipients) {
    try {
      await sendTransactionalEmail({
        to,
        subject: `Approve forwarding from ${input.fromEmail}`,
        text,
      });
    } catch (error) {
      console.error("[forwarding] unknown sender notify failed", {
        workspaceId: input.workspaceId,
        to,
        error,
      });
    }
  }
}
