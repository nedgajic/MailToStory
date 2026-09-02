import prisma from "@/lib/prisma";
import { digestSchema, type Digest } from "@/lib/digest-schema";

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
} | null> {
  const story = await prisma.story.findFirst({
    where: { id: storyId, workspaceId },
  });
  if (!story) return null;
  const parsed = digestSchema.safeParse(story.digest);
  if (!parsed.success) return null;
  const ids = Array.isArray(story.messageIdsInOrder)
    ? story.messageIdsInOrder.filter((x): x is string => typeof x === "string")
    : [];
  return {
    digest: parsed.data,
    messageIdsInOrder: ids,
    conversationId: story.conversationId,
    title: story.title,
    deletedAt: story.deletedAt,
    purgeAt: story.purgeAt,
  };
}
