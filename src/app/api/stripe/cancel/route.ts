import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import prisma from "@/lib/prisma";
import {
  applyPlatformAdminFreePlan,
  isPlatformAdmin,
} from "@/lib/billing/platform-admin-billing";

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
  let resume = false;
  try {
    const body = await req.json();
    resume = Boolean(body?.resume);
  } catch {
    resume = false;
  }

  if (isPlatformAdmin(session.user.email)) {
    if (resume) {
      await prisma.workspace.update({
        where: { id: ctx.workspace.id },
        data: { cancelAtPeriodEnd: false },
      });
      return NextResponse.json({ ok: true, adminBypass: true, cancelAtPeriodEnd: false });
    }

    await applyPlatformAdminFreePlan(ctx);
    return NextResponse.json({ ok: true, adminBypass: true, cancelAtPeriodEnd: false, plan: "free" });
  }

  if (!stripeConfigured() || !ctx.workspace.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription." }, { status: 400 });
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
