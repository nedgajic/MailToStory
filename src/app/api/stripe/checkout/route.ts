import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { parsePlanId, parseBillingInterval, stripePriceIdForPlan, type PlanId } from "@/lib/billing/plans";
import { appUrl } from "@/lib/email/send";
import { loadWorkspaceMembers, validateSeatChange } from "@/lib/billing/seats";
import {
  applyPlatformAdminPlanChange,
  isPlatformAdmin,
} from "@/lib/billing/platform-admin-billing";
import {
  applyTeamOnboardingIfNeeded,
  teamOnboardingErrorMessage,
} from "@/lib/team-workspace";

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

  let body: {
    plan?: PlanId;
    seats?: number;
    teamName?: string;
    inboxSlug?: string;
    interval?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isPlatformAdmin(session.user.email)) {
    try {
      const result = await applyPlatformAdminPlanChange(ctx, body);
      return NextResponse.json({ ok: true, adminBypass: true, ...result });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: teamOnboardingErrorMessage(error.message) },
          { status: 400 },
        );
      }
      throw error;
    }
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
      { status: 503 },
    );
  }

  const plan = parsePlanId(body.plan);
  if (plan === "free") {
    return NextResponse.json({ error: "Use cancel to return to Free." }, { status: 400 });
  }
  if (plan === "team" && ctx.workspace.plan !== "team") {
    if (!body.teamName?.trim() || !body.inboxSlug?.trim()) {
      return NextResponse.json(
        { error: "Enter a team name and shared inbox address." },
        { status: 400 },
      );
    }
  }
  const interval = parseBillingInterval(body.interval);
  const priceId = stripePriceIdForPlan(plan, interval);
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price IDs are missing." }, { status: 503 });
  }
  const seats = plan === "team" ? Math.max(1, Number(body.seats) || 1) : 1;
  if (plan === "team") {
    const members = await loadWorkspaceMembers(ctx.workspace.id);
    const validation = validateSeatChange({
      members,
      targetSeats: seats,
      removeMemberIds: [],
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  try {
    await applyTeamOnboardingIfNeeded(
      ctx.workspace.id,
      ctx.workspace.plan as PlanId,
      plan,
      {
        teamName: body.teamName,
        inboxSlug: body.inboxSlug,
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: teamOnboardingErrorMessage(error.message) },
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
