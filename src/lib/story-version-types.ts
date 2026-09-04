import type { StoryLength } from "@/lib/story-length";

/** Client-safe summary for version picker UI. */
export type StoryVersionSummary = {
  id: string;
  versionNumber: number;
  storyLength: StoryLength;
  title: string;
  createdAt: string | Date;
  isActive: boolean;
  creditCost: number;
};

export function findLatestVersionForLength(
  versions: StoryVersionSummary[],
  length: StoryLength,
): StoryVersionSummary | null {
  const matches = versions.filter((version) => version.storyLength === length);
  if (matches.length === 0) return null;
  return matches.reduce((latest, version) =>
    version.versionNumber > latest.versionNumber ? version : latest,
  );
}
