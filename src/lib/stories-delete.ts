import prisma from "@/lib/prisma";
import { deleteConversations } from "@/lib/inbound/storage";
import {
  ACTIVE_STORY_WHERE,
  DELETED_STORY_WHERE,
  purgeAtForDeletedStory,
} from "@/lib/story-retention";

export async function softDeleteStories(
  workspaceId: string,
  storyIds: string[],
  deletedById?: string,
): Promise<number> {
  const unique = [...new Set(storyIds)];
  if (unique.length === 0) return 0;

  const now = new Date();
  const purgeAt = purgeAtForDeletedStory(now);

  const result = await prisma.story.updateMany({
    where: {
      workspaceId,
      id: { in: unique },
      ...ACTIVE_STORY_WHERE,
    },
    data: {
      deletedAt: now,
      purgeAt,
      deletedById: deletedById ?? null,
    },
  });

  return result.count;
}

export async function softDeleteStoriesByCreatedRange(
  workspaceId: string,
  start: Date,
  end: Date,
  deletedById?: string,
): Promise<number> {
  const rows = await prisma.story.findMany({
    where: {
      workspaceId,
      createdAt: { gte: start, lt: end },
      ...ACTIVE_STORY_WHERE,
    },
    select: { id: true },
  });
  return softDeleteStories(
    workspaceId,
    rows.map((row) => row.id),
    deletedById,
  );
}

export async function restoreStories(
  workspaceId: string,
  storyIds: string[],
): Promise<number> {
  const unique = [...new Set(storyIds)];
  if (unique.length === 0) return 0;

  const result = await prisma.story.updateMany({
    where: {
      workspaceId,
      id: { in: unique },
      ...DELETED_STORY_WHERE,
    },
    data: {
      deletedAt: null,
      purgeAt: null,
      deletedById: null,
    },
  });

  return result.count;
}

export async function permanentlyDeleteStories(
  workspaceId: string,
  storyIds: string[],
): Promise<number> {
  const unique = [...new Set(storyIds)];
  if (unique.length === 0) return 0;

  const rows = await prisma.story.findMany({
    where: {
      workspaceId,
      id: { in: unique },
      ...DELETED_STORY_WHERE,
    },
    select: { conversationId: true },
  });

  if (rows.length === 0) return 0;

  return deleteConversations(
    workspaceId,
    rows.map((row) => row.conversationId),
  );
}

export async function purgeExpiredDeletedStories(): Promise<number> {
  const expired = await prisma.story.findMany({
    where: {
      ...DELETED_STORY_WHERE,
      purgeAt: { lte: new Date() },
    },
    select: { workspaceId: true, conversationId: true },
  });

  if (expired.length === 0) return 0;

  const byWorkspace = new Map<string, string[]>();
  for (const row of expired) {
    const list = byWorkspace.get(row.workspaceId) ?? [];
    list.push(row.conversationId);
    byWorkspace.set(row.workspaceId, list);
  }

  let purged = 0;
  for (const [workspaceId, conversationIds] of byWorkspace) {
    purged += await deleteConversations(workspaceId, conversationIds);
  }

  return purged;
}
