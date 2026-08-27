export type PlanId = "free" | "pro" | "team";
export type MemberRole = "owner" | "admin" | "member";

export const FREE_STORY_LIMIT = 5;
export const PRO_PRICE_USD = 12;
export const TEAM_PRICE_PER_SEAT_USD = 29;
export const MIN_PASSWORD_LENGTH = 10;

export function stripePriceIdForPlan(plan: PlanId): string | undefined {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO?.trim() || undefined;
  if (plan === "team") return process.env.STRIPE_PRICE_TEAM?.trim() || undefined;
  return undefined;
}

export function planFromStripePriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO?.trim()) return "pro";
  if (priceId === process.env.STRIPE_PRICE_TEAM?.trim()) return "team";
  return null;
}

export function monthlyAmountUsd(plan: PlanId, seatQuantity: number): number {
  if (plan === "pro") return PRO_PRICE_USD;
  if (plan === "team") return TEAM_PRICE_PER_SEAT_USD * Math.max(1, seatQuantity);
  return 0;
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
  price: string;
  blurb: string;
  features: string[];
}> = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    blurb: "Try Thread Drop with a private inbound address.",
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
    price: `$${PRO_PRICE_USD}`,
    blurb: "Unlimited stories for one person.",
    features: [
      "1 person",
      "Unlimited stories",
      "1 inbound address",
      "Search, grouping, and exports",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: `$${TEAM_PRICE_PER_SEAT_USD}`,
    blurb: "Shared stories billed per seat.",
    features: [
      "Billed per seat / month",
      "Shared inbound address",
      "Unlimited stories",
      "Admin seat assign and unassign",
    ],
  },
];
