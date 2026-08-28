import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import { getDashboardData } from "@/lib/dashboard-data";
import { AppTopBar } from "@/components/app-top-bar";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { HeldMailBanner } from "@/components/dashboard/held-mail-banner";
import { GenerationLimitBanner } from "@/components/dashboard/generation-limit-banner";
import { BillingPastDueBanner } from "@/components/dashboard/billing-past-due-banner";

export const metadata = { title: "Overview — MailToStory" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");

  const params = await searchParams;
  if (params.billing === "ok" || params.billing === "cancel") {
    redirect(`/settings/billing?billing=${params.billing}`);
  }
  if (params.tab === "billing") {
    redirect("/settings/billing");
  }
  if (params.tab === "stories") {
    redirect("/stories");
  }

  const data = await getDashboardData(ctx);

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
        <div className="dash__inner">
          <HeldMailBanner count={data.heldMailCount} />
          {data.billingPastDue ? (
            <BillingPastDueBanner canBill={data.canBill} />
          ) : null}
          <GenerationLimitBanner used={data.used} limit={data.limit} />
          <DashboardOverview
            firstName={ctx.name?.split(" ")[0] ?? null}
            verified={data.verified}
            used={data.used}
            limit={data.limit}
            planName={data.planName}
            seatsUsed={data.seatsUsed}
            seatQuantity={ctx.workspace.seatQuantity}
            inbound={data.inbound}
            plan={ctx.workspace.plan as PlanId}
          />
        </div>
      </main>
    </>
  );
}
