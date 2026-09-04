import prisma from "@/lib/prisma";
import { digestSchema, type Digest } from "@/lib/digest-schema";
import { parseStoryLength, type StoryLength } from "@/lib/story-length";
import { listStoryVersions } from "@/lib/story-versions";
import type { StoryVersionSummary } from "@/lib/story-version-types";

export type StoryListItem = {
  id: string;
  conversationId: string;
  title: string;
  subject: string;
  status: string;
  resolutionSummary: string;
  createdAt: Date;
  deletedAt: Date | null;
  purgeAt: Date | null;
};

export async function getStoryForWorkspace(
  workspaceId: string,
  storyId: string,
): Promise<{
  digest: Digest;
  messageIdsInOrder: string[];
  conversationId: string;
  title: string;
  deletedAt: Date | null;
  purgeAt: Date | null;
  storyLength: StoryLength;
  activeVersionId: string | null;
  versions: StoryVersionSummary[];
} | null> {
  const story = await prisma.story.findFirst({
    where: { id: storyId, workspaceId },
    select: {
      id: true,
      conversationId: true,
      title: true,
      digest: true,
      messageIdsInOrder: true,
      deletedAt: true,
      purgeAt: true,
      storyLength: true,
      activeVersionId: true,
    },
  });
  if (!story) return null;
  const parsed = digestSchema.safeParse(story.digest);
  if (!parsed.success) return null;
  const ids = Array.isArray(story.messageIdsInOrder)
    ? story.messageIdsInOrder.filter((x): x is string => typeof x === "string")
    : [];
  const versions = await listStoryVersions(story.id, story.activeVersionId);
  return {
    digest: parsed.data,
    messageIdsInOrder: ids,
    conversationId: story.conversationId,
    title: story.title,
    deletedAt: story.deletedAt,
    purgeAt: story.purgeAt,
    storyLength: parseStoryLength(story.storyLength),
    activeVersionId: story.activeVersionId,
    versions,
  };
}
