import prisma from "@/lib/prisma";
import type { PlanId } from "@/lib/billing/plans";
import { storyLimitForPlan } from "@/lib/billing/plans";
import { utcMonthRange } from "@/lib/workspace";

export async function storiesCreatedThisMonth(workspaceId: string): Promise<number> {
  const { start, end } = utcMonthRange();
  return prisma.story.count({
    where: {
      workspaceId,
      createdAt: { gte: start, lt: end },
    },
  });
}

export async function canGenerateStory(plan: PlanId, workspaceId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
}> {
  const used = await storiesCreatedThisMonth(workspaceId);
  const limit = storyLimitForPlan(plan);
  if (limit == null) return { allowed: true, used, limit };
  return { allowed: used < limit, used, limit };
}

export async function activeSeatCount(workspaceId: string): Promise<number> {
  return prisma.workspaceMember.count({
    where: { workspaceId, status: "active" },
  });
}

export async function canAddMember(workspaceId: string, seatQuantity: number): Promise<boolean> {
  const used = await activeSeatCount(workspaceId);
  return used < seatQuantity;
}
