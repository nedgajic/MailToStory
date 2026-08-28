import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import { intervalFromStripePriceId } from "@/lib/billing/plans";
import { getDashboardData } from "@/lib/dashboard-data";
import prisma from "@/lib/prisma";
import { AppTopBar } from "@/components/app-top-bar";
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
  const teamMembers =
    ctx.workspace.plan === "team"
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
    ctx.workspace.plan === "team"
      ? (
          await prisma.workspaceInvite.findMany({
            where: { workspaceId: ctx.workspace.id, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          })
        ).map((invite) => ({ id: invite.id, email: invite.email }))
      : [];

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        plan={ctx.workspace.plan as PlanId}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__bg" aria-hidden="true">
          <div className="dash__orb dash__orb--1" />
          <div className="dash__orb dash__orb--2" />
          <div className="dash__orb dash__orb--3" />
          <div className="dash__grid" />
        </div>
        <div className="dash__inner dash-tab-panel--billing">
          <header className="dash-billing-page__head">
            <p className="home-kicker">Settings</p>
            <h1 className="dash-billing-page__title">
              {ctx.workspace.plan === "free" ? "Choose a plan" : "Billing & Invoices"}
            </h1>
            <p className="dash-billing-page__lead">
              {ctx.workspace.plan === "free"
                ? "Start free or upgrade for 500 stories per month and shared team seats."
                : "Manage your subscription, payment method, and download past invoices."}
            </p>
          </header>

          {data.billingPastDue ? (
            <BillingPastDueBanner canBill={data.canBill} />
          ) : null}
          <GenerationLimitBanner used={data.used} limit={data.limit} />

          <BillingPanel
            plan={ctx.workspace.plan as PlanId}
            workspaceName={ctx.workspace.name}
            canBill={data.canBill}
            seatQuantity={ctx.workspace.seatQuantity}
            seatsUsed={data.seatsUsed}
            cancelAtPeriodEnd={ctx.workspace.cancelAtPeriodEnd}
            stripeReady={data.stripeReady}
            upcoming={data.upcoming}
            billingFlash={billingFlash}
            invoices={data.invoices}
            used={data.used}
            limit={data.limit}
            billingInterval={billingInterval}
            teamMembers={teamMembers}
            teamInvites={teamInvites}
          />
        </div>
      </main>
    </>
  );
}
