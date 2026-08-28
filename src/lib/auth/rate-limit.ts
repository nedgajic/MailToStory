import prisma from "@/lib/prisma";

const DEFAULT_REGISTER_IP_MAX = 10;
const DEFAULT_REGISTER_EMAIL_MAX = 3;
const DEFAULT_LOGIN_IP_MAX = 30;
const DEFAULT_LOGIN_EMAIL_MAX = 10;

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function readHits(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => new Date(String(value)).getTime())
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

function writeHits(hits: number[]): string {
  return JSON.stringify(hits.map((value) => new Date(value).toISOString()));
}

export async function checkAuthRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  const hits = readHits(row?.hitsJson ?? "[]").filter(
    (value) => now - value < windowMs,
  );
  if (hits.length >= max) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, hitsJson: writeHits(hits) },
      update: { hitsJson: writeHits(hits) },
    });
    return false;
  }
  hits.push(now);
  await prisma.authRateLimit.upsert({
    where: { key },
    create: { key, hitsJson: writeHits(hits) },
    update: { hitsJson: writeHits(hits) },
  });
  return true;
}

export async function checkRegisterRateLimit(input: {
  ip: string;
  email: string;
}): Promise<boolean> {
  const ipOk = await checkAuthRateLimit(
    `register:ip:${input.ip}`,
    parsePositiveInt(process.env.AUTH_REGISTER_IP_MAX, DEFAULT_REGISTER_IP_MAX),
    REGISTER_WINDOW_MS,
  );
  if (!ipOk) return false;
  return checkAuthRateLimit(
    `register:email:${input.email.toLowerCase()}`,
    parsePositiveInt(
      process.env.AUTH_REGISTER_EMAIL_MAX,
      DEFAULT_REGISTER_EMAIL_MAX,
    ),
    REGISTER_WINDOW_MS,
  );
}

export async function checkLoginRateLimit(input: {
  ip: string;
  email: string;
}): Promise<boolean> {
  const ipOk = await checkAuthRateLimit(
    `login:ip:${input.ip}`,
    parsePositiveInt(process.env.AUTH_LOGIN_IP_MAX, DEFAULT_LOGIN_IP_MAX),
    LOGIN_WINDOW_MS,
  );
  if (!ipOk) return false;
  return checkAuthRateLimit(
    `login:email:${input.email.toLowerCase()}`,
    parsePositiveInt(
      process.env.AUTH_LOGIN_EMAIL_MAX,
      DEFAULT_LOGIN_EMAIL_MAX,
    ),
    LOGIN_WINDOW_MS,
  );
}
