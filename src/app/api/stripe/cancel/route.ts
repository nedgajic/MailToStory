import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Only owners and admins can cancel." }, { status: 403 });
  }
  if (!stripeConfigured() || !ctx.workspace.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription." }, { status: 400 });
  }

  let resume = false;
  try {
    const body = await req.json();
    resume = Boolean(body?.resume);
  } catch {
    resume = false;
  }

  await getStripe().subscriptions.update(ctx.workspace.stripeSubscriptionId, {
    cancel_at_period_end: !resume,
  });
  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: { cancelAtPeriodEnd: !resume },
  });
  return NextResponse.json({ ok: true, cancelAtPeriodEnd: !resume });
}
