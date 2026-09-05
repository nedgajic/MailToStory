import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import { intervalFromStripePriceId } from "@/lib/billing/plans";
import { getDashboardData } from "@/lib/dashboard-data";
import { isPlatformAdmin } from "@/lib/billing/platform-admin-billing";
import prisma from "@/lib/prisma";
import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { BillingPastDueBanner } from "@/components/dashboard/billing-past-due-banner";
import { GenerationLimitBanner } from "@/components/dashboard/generation-limit-banner";
import "@/app/dashboard-billing.css";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Billing & Invoices — ${BRAND_NAME}` };

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const data = await getDashboardData(ctx);
  const params = await searchParams;
  const billingFlash = params.billing === "ok";
  const billingInterval = intervalFromStripePriceId(ctx.workspace.stripePriceId) ?? "monthly";
  const plan = ctx.workspace.plan as PlanId;
  const teamMembers =
    plan === "team"
      ? (
          await prisma.workspaceMember.findMany({
            where: { workspaceId: ctx.workspace.id, status: "active" },
            include: { user: { select: { email: true, name: true } } },
            orderBy: { createdAt: "asc" },
          })
        ).map((member) => ({
          id: member.id,
          email: member.user.email,
          name: member.user.name,
          role: member.role,
          createdAt: member.createdAt.toISOString(),
        }))
      : [];
  const teamInvites =
    plan === "team"
      ? (
          await prisma.workspaceInvite.findMany({
            where: { workspaceId: ctx.workspace.id, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          })
        ).map((invite) => ({ id: invite.id, email: invite.email }))
      : [];

  const title =
    plan === "free" ? "Choose a plan" : "Billing & invoices";
  const description =
    plan === "free"
      ? "Start free or upgrade for 500 stories per month and shared team seats."
      : "Manage your subscription, payment method, and download past invoices.";

  return (
    <SettingsPageShell
      title={title}
      description={description}
      canManageTeam={isWorkspaceAdmin(ctx.role)}
      plan={plan}
      wide
      billingBackground
    >
      {data.billingPastDue ? (
        <BillingPastDueBanner canBill={data.canBill} />
      ) : null}
      <GenerationLimitBanner
        used={data.used}
        limit={data.limit}
        usedLabel={data.usedCreditsLabel}
        limitLabel={data.limitCreditsLabel}
      />

      <BillingPanel
        plan={plan}
        workspaceName={ctx.workspace.name}
        canBill={data.canBill}
        seatQuantity={ctx.workspace.seatQuantity}
        seatsUsed={data.seatsUsed}
        cancelAtPeriodEnd={ctx.workspace.cancelAtPeriodEnd}
        stripeReady={data.stripeReady}
        platformAdminBilling={isPlatformAdmin(session.user.email)}
        upcoming={data.upcoming}
        billingFlash={billingFlash}
        invoices={data.invoices}
        used={data.used}
        limit={data.limit}
        usedCreditsLabel={data.usedCreditsLabel}
        limitCreditsLabel={data.limitCreditsLabel}
        billingInterval={billingInterval}
        teamMembers={teamMembers}
        teamInvites={teamInvites}
      />
    </SettingsPageShell>
  );
}
