export type PlanId = "free" | "pro" | "team";
export type MemberRole = "owner" | "admin" | "member";
export type BillingInterval = "monthly" | "annual";

export const FREE_STORY_LIMIT = 5;
/** Paid-plan fair-use: max AI generations per calendar month (Pro). */
export const PRO_GENERATION_LIMIT_MONTHLY = 500;
/** Paid-plan fair-use: max AI generations per seat per calendar month (Team). */
export const TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT = 500;
/** Max AI generations per workspace per rolling hour. */
export const GENERATION_LIMIT_HOURLY = 30;
/** Max AI generations per workspace per rolling 24 hours. */
export const GENERATION_LIMIT_DAILY = 200;
/** Min minutes between auto-regenerations on the same thread. */
export const REGENERATION_DEBOUNCE_MINUTES = 15;
export const PRO_PRICE_USD = 14.99;
export const PRO_PRICE_ANNUAL_USD = 149.99;
export const TEAM_PRICE_PER_SEAT_USD = 24.99;
export const TEAM_PRICE_PER_SEAT_ANNUAL_USD = 249.99;
export const MIN_PASSWORD_LENGTH = 10;

export const ANNUAL_SAVE_LABEL = "2 months free";
export const ANNUAL_SAVE_HINT = "Save 2 months with annual billing";
export const ANNUAL_BILLING_NOTE = "Billed once per year";

export function parseBillingInterval(
  value: string | null | undefined,
): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

export function stripePriceIdForPlan(
  plan: PlanId,
  interval: BillingInterval = "monthly",
): string | undefined {
  if (plan === "pro") {
    return interval === "annual"
      ? process.env.STRIPE_PRICE_PRO_ANNUAL?.trim() || undefined
      : process.env.STRIPE_PRICE_PRO?.trim() || undefined;
  }
  if (plan === "team") {
    return interval === "annual"
      ? process.env.STRIPE_PRICE_TEAM_ANNUAL?.trim() || undefined
      : process.env.STRIPE_PRICE_TEAM?.trim() || undefined;
  }
  return undefined;
}

export function intervalFromStripePriceId(
  priceId: string | null | undefined,
): BillingInterval | null {
  if (!priceId) return null;
  const annualIds = [
    process.env.STRIPE_PRICE_PRO_ANNUAL?.trim(),
    process.env.STRIPE_PRICE_TEAM_ANNUAL?.trim(),
  ].filter(Boolean);
  if (annualIds.includes(priceId)) return "annual";
  const monthlyIds = [
    process.env.STRIPE_PRICE_PRO?.trim(),
    process.env.STRIPE_PRICE_TEAM?.trim(),
  ].filter(Boolean);
  if (monthlyIds.includes(priceId)) return "monthly";
  return null;
}

export function planFromStripePriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  const proIds = [
    process.env.STRIPE_PRICE_PRO?.trim(),
    process.env.STRIPE_PRICE_PRO_ANNUAL?.trim(),
  ].filter(Boolean);
  if (proIds.includes(priceId)) return "pro";
  const teamIds = [
    process.env.STRIPE_PRICE_TEAM?.trim(),
    process.env.STRIPE_PRICE_TEAM_ANNUAL?.trim(),
  ].filter(Boolean);
  if (teamIds.includes(priceId)) return "team";
  return null;
}

export function planUnitAmountUsd(
  plan: PlanId,
  interval: BillingInterval,
): number {
  if (plan === "pro") {
    return interval === "annual" ? PRO_PRICE_ANNUAL_USD : PRO_PRICE_USD;
  }
  if (plan === "team") {
    return interval === "annual"
      ? TEAM_PRICE_PER_SEAT_ANNUAL_USD
      : TEAM_PRICE_PER_SEAT_USD;
  }
  return 0;
}

export function monthlyAmountUsd(plan: PlanId, seatQuantity: number): number {
  return billingAmountUsd(plan, "monthly", seatQuantity);
}

export function billingAmountUsd(
  plan: PlanId,
  interval: BillingInterval,
  seatQuantity: number,
): number {
  if (plan === "pro") return planUnitAmountUsd("pro", interval);
  if (plan === "team") {
    return planUnitAmountUsd("team", interval) * Math.max(1, seatQuantity);
  }
  return 0;
}

export function annualPerMonthUsd(plan: PlanId): number {
  if (plan === "free") return 0;
  return planUnitAmountUsd(plan, "annual") / 12;
}

export function formatUsd(amount: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function priceSuffix(
  planId: PlanId,
  interval: BillingInterval,
): string | null {
  if (planId === "free") return null;
  if (planId === "team") return "/ seat / mo";
  if (interval === "annual") return "/ mo";
  return "/ mo";
}

export function storyLimitForPlan(plan: PlanId): number | null {
  if (plan === "free") return FREE_STORY_LIMIT;
  return null;
}

export function planLabel(plan: PlanId): string {
  if (plan === "pro") return "Pro";
  if (plan === "team") return "Team";
  return "Free";
}

export function isPaidPlan(plan: PlanId): boolean {
  return plan === "pro" || plan === "team";
}

export function parsePlanId(value: string | null | undefined): PlanId {
  if (value === "pro" || value === "team" || value === "free") return value;
  return "free";
}

export const PLAN_CARDS: Array<{
  id: PlanId;
  name: string;
  blurb: string;
  features: string[];
}> = [
  {
    id: "free",
    name: "Free",
    blurb: "Forward a handful of threads and see the recap before you pay.",
    features: [
      "1 person",
      `${FREE_STORY_LIMIT} stories per month`,
      "1 inbound address",
      "Story, timeline, and export",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Keep forwarding — every thread becomes a story you can search and export.",
    features: [
      "1 person",
      "500 stories / month (fair use)",
      "1 inbound address",
      "Search, grouping, and exports",
    ],
  },
  {
    id: "team",
    name: "Team",
    blurb: "Colleagues send mail to one address and read the same recaps.",
    features: [
      "Shared inbound address",
      "Shared stories for every seat",
      "500 stories / seat / month (fair use)",
      "Invite, assign, and unassign seats",
    ],
  },
];
