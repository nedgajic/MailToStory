import { describe, expect, it } from "vitest";
import { storyCardExcerpt } from "./story-card-excerpt";

describe("storyCardExcerpt", () => {
  it("returns empty for blank input", () => {
    expect(storyCardExcerpt("   ")).toBe("");
  });

  it("truncates long summaries at a word boundary", () => {
    const text =
      "The team agreed to move forward with the revised proposal after reviewing budget constraints and timeline risks across all stakeholders.";
    const excerpt = storyCardExcerpt(text, 60);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(61);
    expect(excerpt).not.toContain("  ");
  });

  it("keeps short summaries unchanged", () => {
    expect(storyCardExcerpt("Short recap.")).toBe("Short recap.");
  });
});
