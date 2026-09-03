import { describe, expect, it } from "vitest";
import {
  classifyPendingConversation,
  simulatedGenerationPhase,
  splitPendingConversations,
  STORY_GENERATING_WINDOW_MS,
} from "./story-live-status";

describe("story-live-status", () => {
  it("treats recent conversations as generating", () => {
    const now = Date.parse("2026-03-03T12:00:00.000Z");
    const item = {
      id: "c1",
      subject: "Test",
      snippet: "Hello",
      lastMessageAt: new Date(now - 60_000).toISOString(),
    };
    expect(classifyPendingConversation(item, now)).toBe("generating");
  });

  it("treats older conversations as stalled", () => {
    const now = Date.parse("2026-03-03T12:00:00.000Z");
    const item = {
      id: "c1",
      subject: "Test",
      snippet: "Hello",
      lastMessageAt: new Date(now - STORY_GENERATING_WINDOW_MS - 1).toISOString(),
    };
    expect(classifyPendingConversation(item, now)).toBe("stalled");
  });

  it("splits pending lists by generation window", () => {
    const now = Date.parse("2026-03-03T12:00:00.000Z");
    const pending = [
      {
        id: "recent",
        subject: "Recent",
        snippet: "",
        lastMessageAt: new Date(now - 30_000).toISOString(),
      },
      {
        id: "old",
        subject: "Old",
        snippet: "",
        lastMessageAt: new Date(now - STORY_GENERATING_WINDOW_MS - 5_000).toISOString(),
      },
    ];
    const split = splitPendingConversations(pending, now);
    expect(split.generating.map((item) => item.id)).toEqual(["recent"]);
    expect(split.stalled.map((item) => item.id)).toEqual(["old"]);
  });

  it("advances simulated generation phases over time", () => {
    const startedAt = "2026-03-03T12:00:00.000Z";
    const early = simulatedGenerationPhase(startedAt, Date.parse(startedAt) + 1_000);
    const mid = simulatedGenerationPhase(startedAt, Date.parse(startedAt) + 10_000);
    const late = simulatedGenerationPhase(startedAt, Date.parse(startedAt) + 30_000);

    expect(early.statusLine).toBe("Reading your thread");
    expect(mid.stepsDone).toContain("Reading your thread");
    expect(late.indeterminate).toBe(true);
    expect(late.stepsDone).toHaveLength(2);
  });
});
