import { describe, expect, it } from "vitest";
import {
  daysUntilPurge,
  deletedStoryRetentionDays,
  purgeAtForDeletedStory,
} from "@/lib/story-retention";

describe("story-retention", () => {
  it("defaults retention to 30 days", () => {
    delete process.env.DELETED_STORY_RETENTION_DAYS;
    expect(deletedStoryRetentionDays()).toBe(30);
  });

  it("computes purge date from deleted date", () => {
    const deletedAt = new Date("2026-01-01T12:00:00.000Z");
    expect(purgeAtForDeletedStory(deletedAt, 30).toISOString()).toBe(
      "2026-01-31T12:00:00.000Z",
    );
  });

  it("computes days until purge", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const purgeAt = new Date("2026-01-04T00:00:00.000Z");
    expect(daysUntilPurge(purgeAt, now)).toBe(3);
  });
});
