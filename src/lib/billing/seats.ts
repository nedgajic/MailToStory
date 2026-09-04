import prisma from "@/lib/prisma";
import {
  type SeatChangeValidation,
  type WorkspaceMemberRow,
  removableMembers,
  seatsToRemove,
  suggestMemberIdsToRemove,
  validateSeatChange,
} from "@/lib/billing/seats-shared";

export type { SeatChangeValidation, WorkspaceMemberRow } from "@/lib/billing/seats-shared";
export {
  removableMembers,
  seatsToRemove,
  suggestMemberIdsToRemove,
  validateSeatChange,
} from "@/lib/billing/seats-shared";

export async function applySeatReduction(input: {
  workspaceId: string;
  removeMemberIds: string[];
  revokeInviteIds?: string[];
}): Promise<void> {
  const removeMemberIds = [...new Set(input.removeMemberIds)];
  const revokeInviteIds = [...new Set(input.revokeInviteIds ?? [])];

  await prisma.$transaction(async (tx) => {
    if (revokeInviteIds.length > 0) {
      await tx.workspaceInvite.deleteMany({
        where: {
          workspaceId: input.workspaceId,
          id: { in: revokeInviteIds },
        },
      });
    }

    for (const memberId of removeMemberIds) {
      const member = await tx.workspaceMember.findFirst({
        where: { id: memberId, workspaceId: input.workspaceId },
        select: { id: true, userId: true, role: true },
      });
      if (!member || member.role === "owner") continue;
      await tx.workspaceMember.delete({ where: { id: member.id } });
      await tx.user.updateMany({
        where: { id: member.userId, activeWorkspaceId: input.workspaceId },
        data: { activeWorkspaceId: null },
      });
    }
  });
}

export async function loadWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberRow[]> {
  return prisma.workspaceMember.findMany({
    where: { workspaceId, status: "active" },
    select: { id: true, userId: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function activeSeatCount(workspaceId: string): Promise<number> {
  return prisma.workspaceMember.count({
    where: { workspaceId, status: "active" },
  });
}
