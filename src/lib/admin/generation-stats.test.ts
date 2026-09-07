import {
  emptyStoryLengthCounts,
  regenerationMetrics,
  storyLengthCountsFromRows,
  type StoryLengthCounts,
} from "@/lib/admin/generation-stats";
import { describe, expect, it } from "vitest";

describe("storyLengthCountsFromRows", () => {
  it("maps known lengths and ignores unknown values", () => {
    expect(
      storyLengthCountsFromRows([
        { storyLength: "concise", count: 2 },
        { storyLength: "elaborate", count: 1 },
        { storyLength: "unknown", count: 5 },
      ]),
    ).toEqual({
      concise: 2,
      normal: 5,
      elaborate: 1,
    });
  });
});

describe("regenerationMetrics", () => {
  it("derives initial count and average per regenerated story", () => {
    expect(
      regenerationMetrics({
        totalGenerations: 12,
        distinctConversations: 7,
        storiesWithRegenerations: 3,
        regenerations: 5,
      }),
    ).toEqual({
      initialGenerations: 7,
      regenerations: 5,
      avgRegenerationsPerRegeneratedStory: 1.7,
    });
  });

  it("never returns negative regenerations", () => {
    expect(
      regenerationMetrics({
        totalGenerations: 2,
        distinctConversations: 5,
        storiesWithRegenerations: 0,
        regenerations: -3,
      }).regenerations,
    ).toBe(0);
  });
});

describe("emptyStoryLengthCounts", () => {
  it("starts at zero for every tier", () => {
    const counts: StoryLengthCounts = emptyStoryLengthCounts();
    expect(counts).toEqual({ concise: 0, normal: 0, elaborate: 0 });
  });
});
