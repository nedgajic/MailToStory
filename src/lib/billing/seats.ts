import prisma from "@/lib/prisma";

export type WorkspaceMemberRow = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
};

export function seatsToRemove(activeCount: number, targetSeats: number): number {
  return Math.max(0, activeCount - Math.max(1, targetSeats));
}

export function removableMembers(members: WorkspaceMemberRow[]): WorkspaceMemberRow[] {
  return members
    .filter((member) => member.role !== "owner")
    .sort((a, b) => {
      const roleRank = (role: string) => (role === "admin" ? 1 : 0);
      const rankDiff = roleRank(a.role) - roleRank(b.role);
      if (rankDiff !== 0) return rankDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

export function suggestMemberIdsToRemove(
  members: WorkspaceMemberRow[],
  targetSeats: number,
): string[] {
  const activeCount = members.length;
  const count = seatsToRemove(activeCount, targetSeats);
  if (count === 0) return [];
  return removableMembers(members)
    .slice(0, count)
    .map((member) => member.id);
}

export type SeatChangeValidation =
  | { ok: true; removeMemberIds: string[]; revokeInviteIds: string[] }
  | { ok: false; error: string };

export function validateSeatChange(input: {
  members: WorkspaceMemberRow[];
  targetSeats: number;
  removeMemberIds: string[];
  revokeInviteIds?: string[];
}): SeatChangeValidation {
  const target = Math.max(1, Math.floor(input.targetSeats));
  const required = seatsToRemove(input.members.length, target);
  const removeMemberIds = [...new Set(input.removeMemberIds)];
  const revokeInviteIds = [...new Set(input.revokeInviteIds ?? [])];

  if (removeMemberIds.length < required) {
    return {
      ok: false,
      error:
        required === 1
          ? "Choose 1 team member to remove before lowering seats."
          : `Choose ${required} team members to remove before lowering seats.`,
    };
  }

  const removable = new Set(removableMembers(input.members).map((member) => member.id));
  for (const memberId of removeMemberIds) {
    if (!removable.has(memberId)) {
      return { ok: false, error: "The owner must keep a seat. Choose other members to remove." };
    }
  }

  const remaining = input.members.length - removeMemberIds.length;
  if (remaining > target) {
    return {
      ok: false,
      error: `After removing selected members, ${remaining} people would still occupy seats. Remove more or keep more seats.`,
    };
  }

  if (remaining < 1) {
    return { ok: false, error: "At least one person must remain on the team." };
  }

  return { ok: true, removeMemberIds, revokeInviteIds };
}

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
