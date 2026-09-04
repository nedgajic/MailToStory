/** Must match `session.maxAge` in auth.ts (seconds). */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/** Minimum interval between `lastSeenAt` writes during JWT refresh. */
export const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export function isSessionActive(
  lastSeenAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!lastSeenAt) return false;
  return now.getTime() - lastSeenAt.getTime() < SESSION_MAX_AGE_MS;
}

export function sessionExpiresFromLastSeen(
  lastSeenAt: Date,
): Date {
  return new Date(lastSeenAt.getTime() + SESSION_MAX_AGE_MS);
}
