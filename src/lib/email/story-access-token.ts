import prisma from "@/lib/prisma";
import { hashToken, newRawToken } from "@/lib/workspace";

const STORY_ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createStoryAccessToken(
  storyId: string,
  userId: string,
): Promise<string> {
  const raw = newRawToken();
  await prisma.storyAccessToken.create({
    data: {
      storyId,
      userId,
      token: hashToken(raw),
      expiresAt: new Date(Date.now() + STORY_ACCESS_TTL_MS),
    },
  });
  return raw;
}

export type ValidStoryAccess = {
  storyId: string;
  userId: string;
  workspaceId: string;
};

export async function consumeStoryAccessToken(
  rawToken: string,
): Promise<ValidStoryAccess | null> {
  const hashed = hashToken(rawToken.trim());
  const row = await prisma.storyAccessToken.findUnique({
    where: { token: hashed },
  });
  if (!row || row.expiresAt < new Date()) {
    if (row) {
      await prisma.storyAccessToken.delete({ where: { id: row.id } }).catch(() => {});
    }
    return null;
  }

  const story = await prisma.story.findUnique({
    where: { id: row.storyId },
    select: { id: true, workspaceId: true },
  });
  if (!story) {
    await prisma.storyAccessToken.delete({ where: { id: row.id } });
    return null;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: story.workspaceId,
        userId: row.userId,
      },
    },
    select: { status: true },
  });
  if (!membership || membership.status !== "active") {
    await prisma.storyAccessToken.delete({ where: { id: row.id } });
    return null;
  }

  await prisma.storyAccessToken.delete({ where: { id: row.id } });

  return {
    storyId: story.id,
    userId: row.userId,
    workspaceId: story.workspaceId,
  };
}

export async function purgeExpiredStoryAccessTokens(): Promise<void> {
  await prisma.storyAccessToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
