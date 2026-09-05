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
import {
  applyTeamOnboardingIfNeeded,
  teamOnboardingErrorMessage,
} from "@/lib/team-workspace";

export function isPlatformAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}

export type PlatformAdminPlanInput = {
  plan?: string;
  interval?: string;
  seats?: number;
  teamName?: string;
  inboxSlug?: string;
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
  const currentPlan = ctx.workspace.plan as PlanId;
  if (plan === "team" && currentPlan !== "team") {
    if (!body.teamName?.trim() || !body.inboxSlug?.trim()) {
      throw new Error("TEAM_ONBOARDING_REQUIRED");
    }
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
    if (body.teamName?.trim() || body.inboxSlug?.trim()) {
      try {
        await applyTeamOnboardingIfNeeded(ctx.workspace.id, currentPlan, plan, {
          teamName: body.teamName,
          inboxSlug: body.inboxSlug,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(teamOnboardingErrorMessage(error.message));
        }
        throw error;
      }
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
