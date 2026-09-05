import prisma from "@/lib/prisma";
import { digestSchema, type Digest } from "@/lib/digest-schema";
import { creditCostForLength, MAX_STORY_VERSIONS } from "@/lib/billing/credits-shared";
import { parseStoryLength, type StoryLength } from "@/lib/story-length";
import type { StoryVersionSummary } from "@/lib/story-version-types";

export type { StoryVersionSummary } from "@/lib/story-version-types";

export async function createStoryVersion(input: {
  storyId: string;
  title: string;
  status: string;
  resolutionSummary: string;
  searchText: string;
  digest: Digest;
  messageIdsInOrder: string[];
  storyLength: StoryLength;
}): Promise<{ id: string; versionNumber: number }> {
  const creditCost = creditCostForLength(input.storyLength);

  const latest = await prisma.storyVersion.findFirst({
    where: { storyId: input.storyId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;

  const version = await prisma.storyVersion.create({
    data: {
      storyId: input.storyId,
      versionNumber,
      title: input.title,
      status: input.status,
      resolutionSummary: input.resolutionSummary,
      searchText: input.searchText,
      digest: JSON.parse(JSON.stringify(input.digest)),
      messageIdsInOrder: JSON.parse(JSON.stringify(input.messageIdsInOrder)),
      storyLength: input.storyLength,
      creditCost,
    },
    select: { id: true, versionNumber: true },
  });

  await prisma.story.update({
    where: { id: input.storyId },
    data: { activeVersionId: version.id },
  });

  await trimStoryVersions(input.storyId, version.id);

  return version;
}

async function trimStoryVersions(storyId: string, keepActiveId: string): Promise<void> {
  const versions = await prisma.storyVersion.findMany({
    where: { storyId },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });

  if (versions.length <= MAX_STORY_VERSIONS) return;

  const toDelete = versions
    .slice(MAX_STORY_VERSIONS)
    .map((v) => v.id)
    .filter((id) => id !== keepActiveId);

  if (toDelete.length === 0) return;

  await prisma.storyVersion.deleteMany({
    where: { id: { in: toDelete } },
  });
}

export async function listStoryVersions(
  storyId: string,
  activeVersionId: string | null,
): Promise<StoryVersionSummary[]> {
  const rows = await prisma.storyVersion.findMany({
    where: { storyId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      versionNumber: true,
      storyLength: true,
      title: true,
      createdAt: true,
      creditCost: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    versionNumber: row.versionNumber,
    storyLength: parseStoryLength(row.storyLength),
    title: row.title,
    createdAt: row.createdAt,
    isActive: row.id === activeVersionId,
    creditCost: row.creditCost,
  }));
}

export async function activateStoryVersion(
  storyId: string,
  versionId: string,
): Promise<{
  digest: Digest;
  messageIdsInOrder: string[];
  storyLength: StoryLength;
  title: string;
}> {
  const version = await prisma.storyVersion.findFirst({
    where: { id: versionId, storyId },
  });
  if (!version) {
    throw new Error("VERSION_NOT_FOUND");
  }

  const parsed = digestSchema.safeParse(version.digest);
  if (!parsed.success) {
    throw new Error("VERSION_NOT_FOUND");
  }

  const messageIdsInOrder = Array.isArray(version.messageIdsInOrder)
    ? version.messageIdsInOrder.filter((x): x is string => typeof x === "string")
    : [];

  await prisma.story.update({
    where: { id: storyId },
    data: {
      activeVersionId: version.id,
      title: version.title,
      status: version.status,
      resolutionSummary: version.resolutionSummary,
      searchText: version.searchText,
      digest: JSON.parse(JSON.stringify(parsed.data)),
      messageIdsInOrder: JSON.parse(JSON.stringify(messageIdsInOrder)),
      storyLength: version.storyLength,
    },
  });

  return {
    digest: parsed.data,
    messageIdsInOrder,
    storyLength: parseStoryLength(version.storyLength),
    title: version.title,
  };
}
