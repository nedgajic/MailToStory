import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { utcMonthRange } from "@/lib/workspace";
import {
  softDeleteStories,
  softDeleteStoriesByCreatedRange,
} from "@/lib/stories-delete";
import { ACTIVE_STORY_WHERE, DELETED_STORY_WHERE } from "@/lib/story-retention";
import { getStoriesLibrarySummary } from "@/lib/stories-summary";

const storySelect = {
  id: true,
  conversationId: true,
  title: true,
  subject: true,
  status: true,
  resolutionSummary: true,
  createdAt: true,
  deletedAt: true,
  purgeAt: true,
} as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const group = searchParams.get("group") ?? "month";
  const view = searchParams.get("view") ?? "active";
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 80));

  const { start, end } = utcMonthRange();
  const where = {
    workspaceId: ctx.workspace.id,
    ...(view === "deleted" ? DELETED_STORY_WHERE : ACTIVE_STORY_WHERE),
    ...(q
      ? { searchText: { contains: q.toLowerCase(), mode: "insensitive" as const } }
      : {}),
    ...(view === "active" && group === "current"
      ? { createdAt: { gte: start, lt: end } }
      : {}),
  };

  const stories = await prisma.story.findMany({
    where,
    orderBy:
      view === "deleted"
        ? { deletedAt: "desc" }
        : { createdAt: "desc" },
    take: limit,
    select: storySelect,
  });

  const summary =
    view === "deleted"
      ? null
      : await getStoriesLibrarySummary(ctx, session.user.id);
  const unreadStoryIds = new Set(summary?.unreadStoryIds ?? []);

  return NextResponse.json({
    stories: stories.map((story) => ({
      ...story,
      isUnread: unreadStoryIds.has(story.id),
    })),
    quarantine: summary?.quarantine ?? [],
    unreadStoryIds: summary?.unreadStoryIds ?? [],
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ids?: string[]; month?: string; year?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let deleted = 0;
  if (body.ids?.length) {
    deleted = await softDeleteStories(ctx.workspace.id, body.ids, session.user.id);
  } else if (body.month) {
    const [y, m] = body.month.split("-").map(Number);
    if (!y || !m) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    deleted = await softDeleteStoriesByCreatedRange(
      ctx.workspace.id,
      start,
      end,
      session.user.id,
    );
  } else if (body.year) {
    const y = Number(body.year);
    if (!y) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y + 1, 0, 1));
    deleted = await softDeleteStoriesByCreatedRange(
      ctx.workspace.id,
      start,
      end,
      session.user.id,
    );
  }

  return NextResponse.json({ ok: true, deleted });
}
