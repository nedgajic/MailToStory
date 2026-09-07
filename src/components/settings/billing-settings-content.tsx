"use client";

import { useRef } from "react";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import type { BillingInvoice } from "@/components/dashboard/billing-invoices-panel";
import { GenerationLimitBanner } from "@/components/dashboard/generation-limit-banner";
import type { BillingInterval, PlanId } from "@/lib/billing/plans";
import type { UpcomingBill } from "@/lib/dashboard-data";

export function BillingSettingsContent({
  plan,
  workspaceName,
  inboundDomain,
  canBill,
  seatQuantity,
  seatsUsed,
  cancelAtPeriodEnd,
  stripeReady,
  platformAdminBilling,
  upcoming,
  invoices,
  used,
  limit,
  usedCreditsLabel,
  limitCreditsLabel,
  billingInterval,
  teamMembers,
  teamInvites,
}: {
  plan: PlanId;
  workspaceName?: string;
  inboundDomain: string;
  canBill: boolean;
  seatQuantity: number;
  seatsUsed: number;
  cancelAtPeriodEnd: boolean;
  stripeReady: boolean;
  platformAdminBilling: boolean;
  upcoming: UpcomingBill;
  invoices: BillingInvoice[];
  used: number;
  limit: number | null;
  usedCreditsLabel?: string;
  limitCreditsLabel?: string | null;
  billingInterval: BillingInterval;
  teamMembers: Array<{
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
  teamInvites: Array<{ id: string; email: string }>;
}) {
  const focusPlansRef = useRef<(() => void) | null>(null);

  return (
    <>
      <GenerationLimitBanner
        used={used}
        limit={limit}
        usedLabel={usedCreditsLabel}
        limitLabel={limitCreditsLabel}
        billingPage
        onViewPlans={() => focusPlansRef.current?.()}
      />

      <BillingPanel
        plan={plan}
        workspaceName={workspaceName}
        inboundDomain={inboundDomain}
        canBill={canBill}
        seatQuantity={seatQuantity}
        seatsUsed={seatsUsed}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        stripeReady={stripeReady}
        platformAdminBilling={platformAdminBilling}
        upcoming={upcoming}
        invoices={invoices}
        used={used}
        limit={limit}
        usedCreditsLabel={usedCreditsLabel}
        limitCreditsLabel={limitCreditsLabel}
        billingInterval={billingInterval}
        teamMembers={teamMembers}
        teamInvites={teamInvites}
        onRegisterFocusPlans={(focus) => {
          focusPlansRef.current = focus;
        }}
      />
    </>
  );
}
