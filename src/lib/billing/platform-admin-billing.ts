import { isAdminEmail } from "@/lib/admin";
import prisma from "@/lib/prisma";
import type { WorkspaceContext } from "@/lib/session";
import {
  parseBillingInterval,
  parsePlanId,
  stripePriceIdForPlan,
  type PlanId,
} from "@/lib/billing/plans";
import {
  applySeatReduction,
  loadWorkspaceMembers,
  validateSeatChange,
} from "@/lib/billing/seats";
import { updateWorkspaceIdentity } from "@/lib/workspace";

export function isPlatformAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}

async function applyTeamNameIfNeeded(
  workspaceId: string,
  plan: PlanId,
  teamName?: string,
) {
  if (plan !== "team" || !teamName?.trim()) return;
  await updateWorkspaceIdentity(workspaceId, teamName.trim());
}

export type PlatformAdminPlanInput = {
  plan?: string;
  interval?: string;
  seats?: number;
  teamName?: string;
  removeMemberIds?: string[];
  revokeInviteIds?: string[];
};

export async function applyPlatformAdminPlanChange(
  ctx: WorkspaceContext,
  body: PlatformAdminPlanInput,
): Promise<{ seatQuantity: number; plan: PlanId }> {
  const plan = parsePlanId(body.plan);
  if (plan === "free") {
    throw new Error("Use cancel to return to Free.");
  }
  if (plan === "team" && ctx.workspace.plan !== "team" && !body.teamName?.trim()) {
    throw new Error("Enter a team name.");
  }

  const interval = parseBillingInterval(body.interval);
  const priceId = stripePriceIdForPlan(plan, interval);

  let seats =
    plan === "team"
      ? Math.max(1, Number(body.seats) || ctx.workspace.seatQuantity)
      : 1;
  const members = await loadWorkspaceMembers(ctx.workspace.id);

  if (plan === "team") {
    const validation = validateSeatChange({
      members,
      targetSeats: seats,
      removeMemberIds: body.removeMemberIds ?? [],
      revokeInviteIds: body.revokeInviteIds,
    });
    if (!validation.ok) {
      throw new Error(validation.error);
    }
    if (validation.removeMemberIds.length > 0 || validation.revokeInviteIds.length > 0) {
      await applySeatReduction({
        workspaceId: ctx.workspace.id,
        removeMemberIds: validation.removeMemberIds,
        revokeInviteIds: validation.revokeInviteIds,
      });
    }
    if (body.teamName?.trim()) {
      await applyTeamNameIfNeeded(ctx.workspace.id, plan, body.teamName);
    }
  } else if (plan === "pro") {
    const validation = validateSeatChange({
      members,
      targetSeats: 1,
      removeMemberIds: body.removeMemberIds ?? [],
      revokeInviteIds: body.revokeInviteIds,
    });
    if (!validation.ok) {
      throw new Error(
        members.length > 1
          ? "Switching to Pro keeps one seat. Choose which team members to remove first."
          : validation.error,
      );
    }
    if (validation.removeMemberIds.length > 0 || validation.revokeInviteIds.length > 0) {
      await applySeatReduction({
        workspaceId: ctx.workspace.id,
        removeMemberIds: validation.removeMemberIds,
        revokeInviteIds: validation.revokeInviteIds,
      });
    }
    seats = 1;
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (interval === "annual" ? 12 : 1));

  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: {
      plan,
      seatQuantity: seats,
      stripePriceId: priceId,
      cancelAtPeriodEnd: false,
      billingPastDue: false,
      currentPeriodEnd: periodEnd,
      currentPeriodStart: new Date(),
    },
  });

  return { seatQuantity: seats, plan };
}

export async function applyPlatformAdminFreePlan(ctx: WorkspaceContext): Promise<void> {
  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: {
      plan: "free",
      seatQuantity: 1,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      billingPastDue: false,
      currentPeriodEnd: null,
      currentPeriodStart: null,
    },
  });
}

export async function applyPlatformAdminSeatChange(
  ctx: WorkspaceContext,
  body: { seats?: number; removeMemberIds?: string[]; revokeInviteIds?: string[] },
): Promise<{ seatQuantity: number }> {
  const targetSeats = Math.max(1, Number(body.seats) || ctx.workspace.seatQuantity);
  const members = await loadWorkspaceMembers(ctx.workspace.id);
  const validation = validateSeatChange({
    members,
    targetSeats,
    removeMemberIds: body.removeMemberIds ?? [],
    revokeInviteIds: body.revokeInviteIds,
  });
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  if (validation.removeMemberIds.length > 0 || validation.revokeInviteIds.length > 0) {
    await applySeatReduction({
      workspaceId: ctx.workspace.id,
      removeMemberIds: validation.removeMemberIds,
      revokeInviteIds: validation.revokeInviteIds,
    });
  }

  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: {
      seatQuantity: targetSeats,
      cancelAtPeriodEnd: false,
    },
  });

  return { seatQuantity: targetSeats };
}
