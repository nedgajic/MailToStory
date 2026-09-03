import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { ACTIVE_STORY_WHERE } from "@/lib/story-retention";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pending, stories] = await Promise.all([
    prisma.conversation.findMany({
      where: { workspaceId: ctx.workspace.id, story: null },
      orderBy: { lastMessageAt: "desc" },
      take: 20,
      select: {
        id: true,
        subject: true,
        snippet: true,
        lastMessageAt: true,
      },
    }),
    prisma.story.findMany({
      where: { workspaceId: ctx.workspace.id, ...ACTIVE_STORY_WHERE },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        conversationId: true,
        title: true,
        subject: true,
        status: true,
        resolutionSummary: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    pending: pending.map((item) => ({
      ...item,
      lastMessageAt: item.lastMessageAt.toISOString(),
    })),
    stories: stories.map((story) => ({
      ...story,
      createdAt: story.createdAt.toISOString(),
    })),
  });
}
