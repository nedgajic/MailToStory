import prisma from "@/lib/prisma";
import { hashToken, newRawToken } from "@/lib/workspace";

const IDENTIFIER_PREFIX = "2fa-login:";
const PENDING_TTL_MS = 10 * 60 * 1000;

function pendingIdentifier(userId: string): string {
  return `${IDENTIFIER_PREFIX}${userId}`;
}

/** Short-lived token after OAuth when the account has 2FA enabled. */
export async function createPendingTwoFactorLogin(userId: string): Promise<string> {
  const raw = newRawToken();
  const identifier = pendingIdentifier(userId);
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(raw),
      expires: new Date(Date.now() + PENDING_TTL_MS),
    },
  });
  return raw;
}

/** Validates a pending login token and returns the user id (single use). */
export async function consumePendingTwoFactorLogin(raw: string): Promise<string | null> {
  const hashed = hashToken(raw.trim());
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashed,
      identifier: { startsWith: IDENTIFIER_PREFIX },
      expires: { gt: new Date() },
    },
  });
  if (!record) return null;

  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier },
  });

  return record.identifier.slice(IDENTIFIER_PREFIX.length) || null;
}
