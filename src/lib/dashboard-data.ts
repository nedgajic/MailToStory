import prisma from "@/lib/prisma";
import {
  formatBillDate,
  formatStripeAmount,
  getStripe,
  stripeConfigured,
} from "@/lib/billing/stripe";
import {
  monthlyAmountUsd,
  planLabel,
  storyLimitForPlan,
  type PlanId,
} from "@/lib/billing/plans";
import { activeSeatCount, storiesCreatedThisMonth } from "@/lib/billing/entitlements";
import { countVisibleQuarantine } from "@/lib/inbound/quarantine";
import { inboundAddress } from "@/lib/workspace";
import type { WorkspaceContext } from "@/lib/session";
import { isWorkspaceAdmin } from "@/lib/session";

export type UpcomingBill = {
  label: string;
  amountLabel: string | null;
  dateLabel: string | null;
  canceling: boolean;
};

export async function getUpcomingBill(ctx: WorkspaceContext): Promise<UpcomingBill> {
  const plan = ctx.workspace.plan;
  if (plan === "free") {
    return {
      label: "Free plan · No upcoming charge",
      amountLabel: null,
      dateLabel: null,
      canceling: false,
    };
  }

  if (ctx.workspace.cancelAtPeriodEnd) {
    return {
      label: `Access until ${formatBillDate(ctx.workspace.currentPeriodEnd)} · Then Free. You will not be charged.`,
      amountLabel: null,
      dateLabel: formatBillDate(ctx.workspace.currentPeriodEnd),
      canceling: true,
    };
  }

  let amountLabel = `$${monthlyAmountUsd(plan, ctx.workspace.seatQuantity).toFixed(2)}`;
  if (stripeConfigured() && ctx.workspace.stripeCustomerId && ctx.workspace.stripeSubscriptionId) {
    try {
      const upcoming = await getStripe().invoices.createPreview({
        customer: ctx.workspace.stripeCustomerId,
        subscription: ctx.workspace.stripeSubscriptionId,
      });
      amountLabel = formatStripeAmount(upcoming.amount_due, upcoming.currency);
    } catch {
      /* catalog fallback */
    }
  }

  const dateLabel = formatBillDate(ctx.workspace.currentPeriodEnd);
  return {
    label: `Next bill: ${dateLabel} · ${amountLabel}`,
    amountLabel,
    dateLabel,
    canceling: false,
  };
}

export async function getDashboardData(ctx: WorkspaceContext) {
  const [used, seatsUsed, recent, heldMailCount] = await Promise.all([
    storiesCreatedThisMonth(ctx.workspace.id),
    activeSeatCount(ctx.workspace.id),
    prisma.story.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        subject: true,
        status: true,
        resolutionSummary: true,
        createdAt: true,
      },
    }),
    countVisibleQuarantine(ctx),
  ]);

  const upcoming = await getUpcomingBill(ctx);
  const limit = storyLimitForPlan(ctx.workspace.plan);

  return {
    ctx,
    canBill: isWorkspaceAdmin(ctx.role),
    inbound: inboundAddress(ctx.workspace.inboundLocalPart),
    used,
    limit,
    seatsUsed,
    planName: planLabel(ctx.workspace.plan as PlanId),
    upcoming,
    recent,
    verified: Boolean(ctx.emailVerified),
    heldMailCount,
    invoices: await listInvoices(ctx),
    stripeReady: stripeConfigured(),
  };
}

async function listInvoices(ctx: WorkspaceContext) {
  if (!stripeConfigured() || !ctx.workspace.stripeCustomerId) return [];
  const list = await getStripe().invoices.list({
    customer: ctx.workspace.stripeCustomerId,
    limit: 24,
  });
  return list.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    description:
      inv.lines?.data?.[0]?.description?.trim() ||
      inv.description?.trim() ||
      null,
    status: inv.status,
    amount: formatStripeAmount(inv.amount_paid || inv.amount_due, inv.currency),
    created: inv.created,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
  }));
}
