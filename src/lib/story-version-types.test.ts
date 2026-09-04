import { describe, expect, it } from "vitest";
import { findLatestVersionForLength } from "@/lib/story-version-types";

describe("findLatestVersionForLength", () => {
  const versions = [
    {
      id: "a",
      versionNumber: 1,
      storyLength: "normal" as const,
      title: "A",
      createdAt: "2026-01-01",
      isActive: false,
      creditCost: 10,
    },
    {
      id: "b",
      versionNumber: 2,
      storyLength: "elaborate" as const,
      title: "B",
      createdAt: "2026-01-02",
      isActive: true,
      creditCost: 15,
    },
    {
      id: "c",
      versionNumber: 3,
      storyLength: "normal" as const,
      title: "C",
      createdAt: "2026-01-03",
      isActive: false,
      creditCost: 10,
    },
  ];

  it("returns the highest version number for a length", () => {
    expect(findLatestVersionForLength(versions, "normal")?.id).toBe("c");
    expect(findLatestVersionForLength(versions, "elaborate")?.id).toBe("b");
  });

  it("returns null when no version matches", () => {
    expect(findLatestVersionForLength(versions, "concise")).toBeNull();
  });
});
