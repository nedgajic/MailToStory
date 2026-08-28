import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { parsePlanId, parseBillingInterval, stripePriceIdForPlan, type PlanId } from "@/lib/billing/plans";
import prisma from "@/lib/prisma";
import { activeSeatCount } from "@/lib/billing/entitlements";
import { updateWorkspaceIdentity } from "@/lib/workspace";

async function applyTeamNameIfNeeded(
  workspaceId: string,
  plan: PlanId,
  teamName?: string,
) {
  if (plan !== "team" || !teamName?.trim()) return;
  await updateWorkspaceIdentity(workspaceId, teamName.trim());
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Only owners and admins can change plans." }, { status: 403 });
  }
  if (!stripeConfigured() || !ctx.workspace.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription." }, { status: 400 });
  }

  let body: { plan?: PlanId; seats?: number; teamName?: string; interval?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const plan = parsePlanId(body.plan);
  if (plan === "free") {
    return NextResponse.json({ error: "Cancel the subscription to return to Free." }, { status: 400 });
  }
  if (plan === "team" && ctx.workspace.plan !== "team" && !body.teamName?.trim()) {
    return NextResponse.json({ error: "Enter a team name." }, { status: 400 });
  }
  const interval = parseBillingInterval(body.interval);
  const priceId = stripePriceIdForPlan(plan, interval);
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price IDs are missing." }, { status: 503 });
  }

  let seats = plan === "team" ? Math.max(1, Number(body.seats) || ctx.workspace.seatQuantity) : 1;
  if (plan === "team") {
    const used = await activeSeatCount(ctx.workspace.id);
    if (seats < used) {
      return NextResponse.json(
        { error: `Unassign seats first. ${used} people occupy seats.` },
        { status: 400 },
      );
    }
    if (body.teamName?.trim()) {
      try {
        await applyTeamNameIfNeeded(ctx.workspace.id, plan, body.teamName);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_WORKSPACE_NAME") {
          return NextResponse.json(
            { error: "Use at least 2 letters or numbers for the team name." },
            { status: 400 },
          );
        }
        throw error;
      }
    }
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(ctx.workspace.stripeSubscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) {
    return NextResponse.json({ error: "Subscription has no items." }, { status: 400 });
  }

  await stripe.subscriptions.update(ctx.workspace.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId, quantity: seats }],
    proration_behavior: "create_prorations",
    cancel_at_period_end: false,
    metadata: { workspaceId: ctx.workspace.id, plan, interval },
  });

  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: {
      plan,
      stripePriceId: priceId,
      seatQuantity: seats,
      cancelAtPeriodEnd: false,
    },
  });

  return NextResponse.json({ ok: true });
}
