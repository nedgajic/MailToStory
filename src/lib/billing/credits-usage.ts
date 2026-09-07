import type { PlanId } from "@/lib/billing/plans";
import { creditsUsedThisMonth } from "@/lib/billing/generation-limits";
import { creditsRemaining, monthlyCreditAllowance } from "@/lib/billing/credits";

export async function getWorkspaceCreditUsage(
  workspaceId: string,
  plan: PlanId,
  seatQuantity: number,
): Promise<{ usedUnits: number; allowanceUnits: number | null; remainingUnits: number | null }> {
  const usedUnits = await creditsUsedThisMonth(workspaceId);
  const allowanceUnits = monthlyCreditAllowance(plan, seatQuantity);
  return {
    usedUnits,
    allowanceUnits,
    remainingUnits: creditsRemaining(usedUnits, allowanceUnits),
  };
}
