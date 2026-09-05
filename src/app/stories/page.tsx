import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import prisma from "@/lib/prisma";
import { AppTopBar } from "@/components/app-top-bar";
import { StoriesDashboard } from "@/components/stories/stories-dashboard";
import { inboundAddress } from "@/lib/workspace";
import { ACTIVE_STORY_WHERE, DELETED_STORY_WHERE } from "@/lib/story-retention";
import { getStoriesLibrarySummary } from "@/lib/stories-summary";

import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Stories — ${BRAND_NAME}` };

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; view?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const sp = await searchParams;

  const [stories, pending, deletedCount, summary] = await Promise.all([
    prisma.story.findMany({
      where: { workspaceId: ctx.workspace.id, ...ACTIVE_STORY_WHERE },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        subject: true,
        status: true,
        resolutionSummary: true,
        createdAt: true,
      },
    }),
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
    prisma.story.count({
      where: { workspaceId: ctx.workspace.id, ...DELETED_STORY_WHERE },
    }),
    getStoriesLibrarySummary(ctx, session.user.id),
  ]);

  const unreadStoryIdSet = new Set(summary.unreadStoryIds);

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        plan={ctx.workspace.plan as PlanId}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">Library</p>
            <h1>Stories</h1>
            <p>Search, group by month or year, and manage your story library.</p>
          </header>
          <StoriesDashboard
            inbound={inboundAddress(ctx.workspace.inboundLocalPart)}
            isFree={ctx.workspace.plan === "free"}
            verified={Boolean(ctx.emailVerified)}
            deletedCount={deletedCount}
            showDeletedBanner={sp.deleted === "1"}
            initialLibraryView={sp.view === "deleted" ? "deleted" : "active"}
            initialQuarantine={summary.quarantine}
            initialStories={stories.map((s) => ({
              ...s,
              createdAt: s.createdAt.toISOString(),
              isUnread: unreadStoryIdSet.has(s.id),
            }))}
            initialPending={pending.map((item) => ({
              ...item,
              lastMessageAt: item.lastMessageAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
