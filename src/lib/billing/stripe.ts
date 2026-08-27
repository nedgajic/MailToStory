import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export function formatStripeAmount(amount: number | null | undefined, currency = "usd"): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

export function formatBillDate(value: Date | number | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
