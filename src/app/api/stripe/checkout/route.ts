import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { parsePlanId, parseBillingInterval, stripePriceIdForPlan, type PlanId } from "@/lib/billing/plans";
import { appUrl } from "@/lib/email/send";
import { updateWorkspaceIdentity } from "@/lib/workspace";

async function applyTeamNameIfNeeded(
  workspaceId: string,
  plan: PlanId,
  teamName?: string,
) {
  if (plan !== "team" || !teamName?.trim()) return;
  await updateWorkspaceIdentity(workspaceId, teamName.trim());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Only owners and admins can change billing." }, { status: 403 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
      { status: 503 },
    );
  }

  let body: { plan?: PlanId; seats?: number; teamName?: string; interval?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const plan = parsePlanId(body.plan);
  if (plan === "free") {
    return NextResponse.json({ error: "Use cancel to return to Free." }, { status: 400 });
  }
  if (plan === "team" && !body.teamName?.trim()) {
    return NextResponse.json({ error: "Enter a team name." }, { status: 400 });
  }
  const interval = parseBillingInterval(body.interval);
  const priceId = stripePriceIdForPlan(plan, interval);
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price IDs are missing." }, { status: 503 });
  }
  const seats = plan === "team" ? Math.max(1, Number(body.seats) || 1) : 1;

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

  const stripe = getStripe();
  const sessionCheckout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: ctx.workspace.stripeCustomerId || undefined,
    customer_email: ctx.workspace.stripeCustomerId
      ? undefined
      : ctx.email || undefined,
    client_reference_id: ctx.workspace.id,
    metadata: { workspaceId: ctx.workspace.id, plan, interval },
    line_items: [{ price: priceId, quantity: seats }],
    success_url: appUrl("/settings/billing?billing=ok"),
    cancel_url: appUrl("/settings/billing?billing=cancel"),
    subscription_data: {
      metadata: { workspaceId: ctx.workspace.id, plan, interval },
    },
  });

  return NextResponse.json({ url: sessionCheckout.url });
}
