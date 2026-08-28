import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/billing/stripe";
import { planFromStripePriceId, parsePlanId } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          session.metadata?.workspaceId || session.client_reference_id;
        if (!workspaceId || !session.subscription || !session.customer) break;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer.id;
        await syncSubscription(workspaceId, subId, customerId);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspaceId;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        if (event.type === "customer.subscription.deleted") {
          await prisma.workspace.updateMany({
            where: workspaceId
              ? { id: workspaceId }
              : { stripeSubscriptionId: sub.id },
            data: {
              plan: "free",
              stripeSubscriptionId: null,
              stripePriceId: null,
              cancelAtPeriodEnd: false,
              billingPastDue: false,
              seatQuantity: 1,
            },
          });
          break;
        }
        if (workspaceId) {
          await syncSubscription(workspaceId, sub.id, customerId);
        } else {
          const ws = await prisma.workspace.findFirst({
            where: { stripeSubscriptionId: sub.id },
          });
          if (ws) await syncSubscription(ws.id, sub.id, customerId);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = stripeCustomerId(invoice.customer);
        if (customerId) {
          await prisma.workspace.updateMany({
            where: { stripeCustomerId: customerId },
            data: { billingPastDue: true },
          });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = stripeCustomerId(invoice.customer);
        if (customerId) {
          await prisma.workspace.updateMany({
            where: { stripeCustomerId: customerId },
            data: { billingPastDue: false },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook]", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  workspaceId: string,
  subscriptionId: string,
  customerId: string,
) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const quantity = item?.quantity ?? 1;
  const plan =
    planFromStripePriceId(priceId) ||
    parsePlanId(sub.metadata?.plan) ||
    "free";
  const periodEnd = periodEndFromSub(sub);
  const periodStart = periodStartFromSub(sub);
  const isPaidActive = sub.status === "active" || sub.status === "trialing";
  const billingPastDue = sub.status === "past_due" || sub.status === "unpaid";

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan: isPaidActive || billingPastDue ? plan : "free",
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      seatQuantity: plan === "team" ? quantity : 1,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      billingPastDue,
      currentPeriodEnd: periodEnd,
      currentPeriodStart: periodStart,
    },
  });
}

function stripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function periodEndFromSub(sub: Stripe.Subscription): Date | null {
  const seconds =
    (sub as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

function periodStartFromSub(sub: Stripe.Subscription): Date | null {
  const seconds =
    (sub as { current_period_start?: number }).current_period_start ??
    sub.items.data[0]?.current_period_start;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}
