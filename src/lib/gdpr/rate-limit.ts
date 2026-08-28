const buckets = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

export function checkGdprRateLimit(key: string): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export function gdprRateLimitKey(email: string, ip: string | null): string {
  return `gdpr:${email.toLowerCase()}:${ip ?? "unknown"}`;
}
