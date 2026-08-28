import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import prisma from "@/lib/prisma";
import { AppTopBar } from "@/components/app-top-bar";
import { StoriesLibrary } from "@/components/stories/stories-library";
import { PendingStories } from "@/components/stories/pending-stories";
import { inboundAddress } from "@/lib/workspace";

import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Stories — ${BRAND_NAME}` };

export default async function StoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");

  const [stories, pending] = await Promise.all([
    prisma.story.findMany({
      where: { workspaceId: ctx.workspace.id },
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
  ]);

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
            <p>Search, group by month or year, and delete old reports.</p>
          </header>
          <PendingStories
            initial={pending.map((item) => ({
              ...item,
              lastMessageAt: item.lastMessageAt.toISOString(),
            }))}
          />
          <StoriesLibrary
            inbound={inboundAddress(ctx.workspace.inboundLocalPart)}
            isFree={ctx.workspace.plan === "free"}
            verified={Boolean(ctx.emailVerified)}
            initial={stories.map((s) => ({
              ...s,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
