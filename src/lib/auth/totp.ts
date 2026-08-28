import { randomBytes } from "node:crypto";
import { TOTP, Secret } from "otpauth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { decryptTotpSecret, encryptTotpSecret } from "@/lib/auth/totp-crypto";
import { BRAND_NAME } from "@/lib/brand";

const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_LENGTH = 10;

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function buildTotp(email: string, secretBase32: string): TOTP {
  return new TOTP({
    issuer: BRAND_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export function buildTotpUri(email: string, secretBase32: string): string {
  return buildTotp(email, secretBase32).toString();
}

export function verifyTotpCode(secretBase32: string, email: string, code: string): boolean {
  const normalized = code.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(normalized)) return false;
  const delta = buildTotp(email, secretBase32).validate({ token: normalized, window: 1 });
  return delta != null;
}

export function encryptSecretForStorage(secretBase32: string): string {
  return encryptTotpSecret(secretBase32);
}

export function decryptSecretFromStorage(payload: string): string {
  return decryptTotpSecret(payload);
}

function randomBackupCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(BACKUP_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < BACKUP_CODE_LENGTH; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export async function generateBackupCodes(): Promise<{ plain: string[]; hashedJson: string }> {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, () => randomBackupCode());
  const hashed = await Promise.all(plain.map((code) => hashPassword(code)));
  return { plain, hashedJson: JSON.stringify(hashed) };
}

export async function verifyBackupCode(
  code: string,
  hashedJson: string | null | undefined,
): Promise<{ ok: boolean; nextHashedJson: string | null }> {
  if (!hashedJson) return { ok: false, nextHashedJson: null };
  let hashes: string[];
  try {
    hashes = JSON.parse(hashedJson) as string[];
  } catch {
    return { ok: false, nextHashedJson: null };
  }
  const normalized = code.replace(/\s+/g, "").trim().toUpperCase();
  for (let i = 0; i < hashes.length; i += 1) {
    const hash = hashes[i];
    if (!hash) continue;
    if (await verifyPassword(normalized, hash)) {
      const next = [...hashes];
      next.splice(i, 1);
      return { ok: true, nextHashedJson: next.length > 0 ? JSON.stringify(next) : null };
    }
  }
  return { ok: false, nextHashedJson: hashedJson };
}

export async function verifyLoginTotp(input: {
  email: string;
  encryptedSecret: string;
  backupCodesJson: string | null;
  code: string;
}): Promise<{ ok: boolean; nextBackupCodesJson?: string | null }> {
  const secret = decryptSecretFromStorage(input.encryptedSecret);
  if (verifyTotpCode(secret, input.email, input.code)) {
    return { ok: true };
  }
  const backup = await verifyBackupCode(input.code, input.backupCodesJson);
  if (!backup.ok) return { ok: false };
  return { ok: true, nextBackupCodesJson: backup.nextHashedJson };
}
