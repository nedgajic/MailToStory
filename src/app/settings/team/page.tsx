import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import { intervalFromStripePriceId } from "@/lib/billing/plans";
import { stripeConfigured } from "@/lib/billing/stripe";
import { isPlatformAdmin } from "@/lib/billing/platform-admin-billing";
import prisma from "@/lib/prisma";
import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { SettingsSection } from "@/components/settings/settings-section";
import { TeamManager } from "@/components/team/team-manager";
import { SeatChangeForm } from "@/components/team/seat-change-form";
import { TransferOwnershipForm } from "@/components/team/transfer-ownership-form";
import { TeamNameForm } from "@/components/team/team-name-form";
import { inboundAddress } from "@/lib/workspace";
import { activeSeatCount } from "@/lib/billing/seats";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Team — ${BRAND_NAME}` };

export default async function TeamSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  if (!isWorkspaceAdmin(ctx.role)) redirect("/dashboard");
  const isOwner = ctx.role === "owner";

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

  const plan = ctx.workspace.plan as PlanId;
  const seatsUsed = await activeSeatCount(ctx.workspace.id);
  const billingInterval = intervalFromStripePriceId(ctx.workspace.stripePriceId) ?? "monthly";

  return (
    <SettingsPageShell
      title="Team"
      description="Manage seats, invites, and your shared inbox."
      canManageTeam
      plan={plan}
    >
      <TeamNameForm
        initialName={ctx.workspace.name}
        inbound={inboundAddress(ctx.workspace.inboundLocalPart)}
        plan={ctx.workspace.plan}
      />
      {plan === "team" ? (
        <SeatChangeForm
          seatQuantity={ctx.workspace.seatQuantity}
          seatsUsed={seatsUsed}
          interval={billingInterval}
          stripeReady={stripeConfigured()}
          platformAdminBilling={isPlatformAdmin(session.user.email)}
          members={members.map((m) => ({
            id: m.id,
            email: m.user.email,
            name: m.user.name,
            role: m.role,
            createdAt: m.createdAt.toISOString(),
          }))}
          invites={invites.map((i) => ({
            id: i.id,
            email: i.email,
          }))}
        />
      ) : null}
      <SettingsSection title="Members">
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
      </SettingsSection>
      {isOwner && members.length > 1 ? (
        <TransferOwnershipForm
          members={members
            .filter((member) => member.role !== "owner")
            .map((member) => ({
              id: member.id,
              name: member.user.name,
              email: member.user.email,
            }))}
        />
      ) : null}
    </SettingsPageShell>
  );
}
