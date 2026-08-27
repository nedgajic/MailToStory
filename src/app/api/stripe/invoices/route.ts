import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import {
  formatStripeAmount,
  getStripe,
  stripeConfigured,
} from "@/lib/billing/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripeConfigured() || !ctx.workspace.stripeCustomerId) {
    return NextResponse.json({ invoices: [] });
  }

  const list = await getStripe().invoices.list({
    customer: ctx.workspace.stripeCustomerId,
    limit: 24,
  });

  const invoices = list.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amount: formatStripeAmount(inv.amount_paid || inv.amount_due, inv.currency),
    created: inv.created,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
  }));

  return NextResponse.json({ invoices });
}
