import { describe, expect, it } from "vitest";
import {
  canUseElaborateStoryLength,
  DEFAULT_STORY_LENGTH,
  parseStoryLength,
} from "@/lib/story-length";

describe("parseStoryLength", () => {
  it("parses known values", () => {
    expect(parseStoryLength("concise")).toBe("concise");
    expect(parseStoryLength("normal")).toBe("normal");
    expect(parseStoryLength("elaborate")).toBe("elaborate");
  });

  it("falls back to normal for invalid input", () => {
    expect(parseStoryLength(undefined)).toBe(DEFAULT_STORY_LENGTH);
    expect(parseStoryLength("verbose")).toBe(DEFAULT_STORY_LENGTH);
  });
});

describe("canUseElaborateStoryLength", () => {
  it("allows paid plans", () => {
    expect(canUseElaborateStoryLength("pro")).toBe(true);
    expect(canUseElaborateStoryLength("team")).toBe(true);
  });

  it("blocks free plan", () => {
    expect(canUseElaborateStoryLength("free")).toBe(false);
  });
});
