import type { PlanId } from "@/lib/billing/plans";
import {
  FREE_STORY_LIMIT,
  PRO_GENERATION_LIMIT_MONTHLY,
  TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT,
} from "@/lib/billing/plans";
import type { StoryLength } from "@/lib/story-length";
import {
  CREDIT_UNIT,
  creditCostForLength as creditCostForLengthShared,
  formatCredits,
  MAX_STORY_VERSIONS,
  type CreditStoryLength,
} from "@/lib/billing/credits-shared";

export {
  CREDIT_UNIT,
  CREDIT_COST_BY_LENGTH,
  MAX_STORY_VERSIONS,
  formatCredits,
  creditCostLabel,
} from "@/lib/billing/credits-shared";

export function creditCostForLength(length: StoryLength): number {
  return creditCostForLengthShared(length as CreditStoryLength);
}

export function monthlyCreditAllowance(
  plan: PlanId,
  seatQuantity: number,
): number | null {
  if (plan === "free") {
    return FREE_STORY_LIMIT * CREDIT_UNIT;
  }
  if (plan === "pro") {
    return PRO_GENERATION_LIMIT_MONTHLY * CREDIT_UNIT;
  }
  return TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT * Math.max(1, seatQuantity) * CREDIT_UNIT;
}

export function creditsRemaining(used: number, allowance: number | null): number | null {
  if (allowance == null) return null;
  return Math.max(0, allowance - used);
}

export function hasEnoughCredits(
  used: number,
  allowance: number | null,
  cost: number,
): boolean {
  if (allowance == null) return true;
  return used + cost <= allowance;
}
