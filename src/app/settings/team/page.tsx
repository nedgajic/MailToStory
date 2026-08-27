import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getUpcomingBill } from "@/lib/dashboard-data";
import prisma from "@/lib/prisma";
import { AppTopBar } from "@/components/app-top-bar";
import { TeamManager } from "@/components/team/team-manager";

export const metadata = { title: "Team — MailToStory" };

export default async function TeamSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  if (!isWorkspaceAdmin(ctx.role)) redirect("/dashboard");
  const upcoming = await getUpcomingBill(ctx);

  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: ctx.workspace.id, status: "active" },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId: ctx.workspace.id, expiresAt: { gt: new Date() } },
    }),
  ]);

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam
        billingLabel={upcoming.label}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">Team</p>
            <h1>Seats and people</h1>
            <p>Assign a seat by inviting an email. Unassign to free a seat.</p>
          </header>
          <TeamManager
            seatQuantity={ctx.workspace.seatQuantity}
            members={members.map((m) => ({
              id: m.id,
              userId: m.userId,
              email: m.user.email,
              name: m.user.name,
              role: m.role,
            }))}
            invites={invites.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              expiresAt: i.expiresAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
