import { describe, expect, it } from "vitest";
import {
  isSessionActive,
  SESSION_MAX_AGE_MS,
  sessionExpiresFromLastSeen,
} from "./session-config";

describe("session-config", () => {
  it("treats recent lastSeenAt as an active JWT session", () => {
    const now = new Date("2026-09-04T12:00:00.000Z");
    const lastSeenAt = new Date(now.getTime() - 60 * 60 * 1000);
    expect(isSessionActive(lastSeenAt, now)).toBe(true);
  });

  it("treats stale lastSeenAt as signed out", () => {
    const now = new Date("2026-09-04T12:00:00.000Z");
    const lastSeenAt = new Date(now.getTime() - SESSION_MAX_AGE_MS - 1);
    expect(isSessionActive(lastSeenAt, now)).toBe(false);
  });

  it("derives expiry from lastSeenAt plus max age", () => {
    const lastSeenAt = new Date("2026-09-01T10:00:00.000Z");
    expect(sessionExpiresFromLastSeen(lastSeenAt).toISOString()).toBe(
      new Date(lastSeenAt.getTime() + SESSION_MAX_AGE_MS).toISOString(),
    );
  });
});
