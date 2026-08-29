import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import {
  intervalFromStripePriceId,
  parsePlanId,
  type BillingInterval,
} from "@/lib/billing/plans";
import prisma from "@/lib/prisma";
import {
  applyPlatformAdminSeatChange,
  isPlatformAdmin,
} from "@/lib/billing/platform-admin-billing";
import {
  applySeatReduction,
  loadWorkspaceMembers,
  validateSeatChange,
} from "@/lib/billing/seats";

async function updateStripeSeatQuantity(input: {
  subscriptionId: string;
  seats: number;
  interval: BillingInterval;
  workspaceId: string;
}) {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(input.subscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) {
    throw new Error("Subscription has no items.");
  }
  const priceId = sub.items.data[0]?.price.id;
  const currentInterval = intervalFromStripePriceId(priceId) ?? input.interval;

  await stripe.subscriptions.update(input.subscriptionId, {
    items: [{ id: itemId, quantity: input.seats }],
    proration_behavior: "create_prorations",
    cancel_at_period_end: false,
    metadata: {
      workspaceId: input.workspaceId,
      plan: "team",
      interval: currentInterval,
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Only owners and admins can change seats." }, { status: 403 });
  }
  if (parsePlanId(ctx.workspace.plan) !== "team") {
    return NextResponse.json({ error: "Seat changes are only available on the Team plan." }, { status: 400 });
  }

  let body: { seats?: number; removeMemberIds?: string[]; revokeInviteIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isPlatformAdmin(session.user.email)) {
    try {
      const result = await applyPlatformAdminSeatChange(ctx, body);
      return NextResponse.json({ ok: true, adminBypass: true, ...result });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not update seats." },
        { status: 400 },
      );
    }
  }

  if (!stripeConfigured() || !ctx.workspace.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active Team subscription." }, { status: 400 });
  }

  const targetSeats = Math.max(1, Number(body.seats) || ctx.workspace.seatQuantity);
  const members = await loadWorkspaceMembers(ctx.workspace.id);
  const validation = validateSeatChange({
    members,
    targetSeats,
    removeMemberIds: body.removeMemberIds ?? [],
    revokeInviteIds: body.revokeInviteIds,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (validation.removeMemberIds.length > 0 || validation.revokeInviteIds.length > 0) {
    await applySeatReduction({
      workspaceId: ctx.workspace.id,
      removeMemberIds: validation.removeMemberIds,
      revokeInviteIds: validation.revokeInviteIds,
    });
  }

  const interval =
    intervalFromStripePriceId(ctx.workspace.stripePriceId) ?? "monthly";

  await updateStripeSeatQuantity({
    subscriptionId: ctx.workspace.stripeSubscriptionId,
    seats: targetSeats,
    interval,
    workspaceId: ctx.workspace.id,
  });

  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: {
      seatQuantity: targetSeats,
      cancelAtPeriodEnd: false,
    },
  });

  return NextResponse.json({
    ok: true,
    seatQuantity: targetSeats,
    removedMembers: validation.removeMemberIds.length,
    revokedInvites: validation.revokeInviteIds.length,
  });
}
