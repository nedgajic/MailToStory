import prisma from "@/lib/prisma";
import { ACTIVE_STORY_WHERE } from "@/lib/story-retention";

export async function markStoryViewed(
  userId: string,
  storyId: string,
): Promise<void> {
  await prisma.storyView.upsert({
    where: { userId_storyId: { userId, storyId } },
    create: { userId, storyId },
    update: { viewedAt: new Date() },
  });
}

export async function getUnreadStoryIds(
  userId: string,
  workspaceId: string,
): Promise<Set<string>> {
  const [viewed, activeStories] = await Promise.all([
    prisma.storyView.findMany({
      where: { userId, story: { workspaceId } },
      select: { storyId: true },
    }),
    prisma.story.findMany({
      where: { workspaceId, ...ACTIVE_STORY_WHERE },
      select: { id: true },
    }),
  ]);

  const viewedIds = new Set(viewed.map((row) => row.storyId));
  const unread = new Set<string>();
  for (const story of activeStories) {
    if (!viewedIds.has(story.id)) unread.add(story.id);
  }
  return unread;
}

export async function countUnreadStories(
  userId: string,
  workspaceId: string,
): Promise<number> {
  const unread = await getUnreadStoryIds(userId, workspaceId);
  return unread.size;
}
