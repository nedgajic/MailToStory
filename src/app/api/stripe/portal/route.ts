import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { appUrl } from "@/lib/email/send";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Only owners and admins can manage payment methods." }, { status: 403 });
  }
  if (!stripeConfigured() || !ctx.workspace.stripeCustomerId) {
    return NextResponse.json({ error: "No billing customer yet." }, { status: 400 });
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: ctx.workspace.stripeCustomerId,
    return_url: appUrl("/dashboard"),
  });
  return NextResponse.json({ url: portal.url });
}
