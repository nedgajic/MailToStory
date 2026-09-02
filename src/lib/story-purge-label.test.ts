import { describe, expect, it } from "vitest";
import { formatPurgeDetail } from "@/lib/story-purge-label";

describe("formatPurgeDetail", () => {
  it("formats same-day purge", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const purgeAt = new Date("2026-03-01T12:00:00.000Z");
    expect(formatPurgeDetail(purgeAt, now)).toBe("Permanently deletes today");
  });

  it("formats purge with days remaining", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const purgeAt = new Date("2026-03-04T00:00:00.000Z");
    expect(formatPurgeDetail(purgeAt, now)).toBe(
      "Permanently deletes Mar 4, 2026 (3 days left)",
    );
  });
});
