import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getUpcomingBill } from "@/lib/dashboard-data";
import prisma from "@/lib/prisma";
import { AppTopBar } from "@/components/app-top-bar";
import { StoriesLibrary } from "@/components/stories/stories-library";
import { inboundAddress } from "@/lib/workspace";

export const metadata = { title: "Stories — MailToStory" };

export default async function StoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const upcoming = await getUpcomingBill(ctx);

  const stories = await prisma.story.findMany({
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
  });

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        billingLabel={upcoming.label}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">Library</p>
            <h1>Stories</h1>
            <p>Search, group by month or year, and delete old reports.</p>
          </header>
          <StoriesLibrary
            inbound={inboundAddress(ctx.workspace.inboundLocalPart)}
            isFree={ctx.workspace.plan === "free"}
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
