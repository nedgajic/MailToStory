import prisma from "@/lib/prisma";
import {
  getGenerationCountsByWorkspace,
  countWorkspaceGenerations,
} from "@/lib/admin/generation-stats";
import {
  isSessionActive,
  SESSION_MAX_AGE_MS,
  sessionExpiresFromLastSeen,
} from "@/lib/auth/session-config";

export type AdminUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  digestCount: number;
  uniqueThreads: number;
  generationCount: number;
  regenerationCount: number;
  firstDigestAt: Date | null;
  lastDigestAt: Date | null;
  activeSession: boolean;
  sessionExpiresAt: Date | null;
  googleLinked: boolean;
  plan: string | null;
};

export type AdminUserSummary = {
  totalUsers: number;
  usersWithDigests: number;
  activeSessions: number;
  totalDigests: number;
};

function maxDate(...values: Array<Date | null | undefined>): Date | null {
  const valid = values.filter((v): v is Date => v instanceof Date);
  if (valid.length === 0) return null;
  return valid.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
}

export async function getAdminUserSummary(): Promise<AdminUserSummary> {
  const now = new Date();
  const activeSince = new Date(now.getTime() - SESSION_MAX_AGE_MS);
  const [totalUsers, usersWithDigests, activeSessions, totalDigests] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { memberships: { some: { workspace: { conversations: { some: { story: { isNot: null } } } } } } },
      }),
      prisma.user.count({
        where: {
          OR: [
            { sessions: { some: { expires: { gt: now } } } },
            { lastSeenAt: { gte: activeSince } },
          ],
        },
      }),
      prisma.story.count(),
    ]);

  return {
    totalUsers,
    usersWithDigests,
    activeSessions,
    totalDigests,
  };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const now = new Date();
  const countsByWorkspace = await getGenerationCountsByWorkspace();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      lastSeenAt: true,
      sessions: {
        select: { expires: true },
        where: { expires: { gt: now } },
        orderBy: { expires: "desc" },
        take: 1,
      },
      accounts: {
        select: { provider: true },
      },
      memberships: {
        where: { role: "owner" },
        select: {
          workspace: {
            select: {
              id: true,
              plan: true,
              conversations: {
                select: {
                  story: { select: { createdAt: true, updatedAt: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const rows: AdminUserRow[] = users.map((user) => {
    const stories = user.memberships.flatMap((m) =>
      m.workspace.conversations
        .map((c) => c.story)
        .filter((s): s is { createdAt: Date; updatedAt: Date } => s != null),
    );
    const digestCount = stories.length;
    const firstDigestAt =
      digestCount > 0
        ? stories.reduce(
            (earliest, row) =>
              row.createdAt < earliest ? row.createdAt : earliest,
            stories[0]!.createdAt,
          )
        : null;
    const lastDigestAt =
      digestCount > 0
        ? stories.reduce(
            (latest, row) =>
              row.updatedAt > latest ? row.updatedAt : latest,
            stories[0]!.updatedAt,
          )
        : null;
    const sessionExpiresAt = user.sessions[0]?.expires ?? null;
    const jwtActive = isSessionActive(user.lastSeenAt, now);
    const activeSession = sessionExpiresAt !== null || jwtActive;
    const sessionDisplayExpiresAt =
      sessionExpiresAt ??
      (jwtActive && user.lastSeenAt
        ? sessionExpiresFromLastSeen(user.lastSeenAt)
        : null);

    const workspaceIds = user.memberships.map((m) => m.workspace.id);
    const generationTotals = countWorkspaceGenerations(
      workspaceIds,
      countsByWorkspace,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      digestCount,
      uniqueThreads: digestCount,
      generationCount: generationTotals.generations,
      regenerationCount: generationTotals.regenerations,
      firstDigestAt,
      lastDigestAt,
      activeSession,
      sessionExpiresAt: sessionDisplayExpiresAt,
      googleLinked: user.accounts.some((a) => a.provider === "google"),
      plan: user.memberships[0]?.workspace.plan ?? null,
    };
  });

  rows.sort((a, b) => {
    const aTime = maxDate(a.lastDigestAt, a.sessionExpiresAt)?.getTime() ?? 0;
    const bTime = maxDate(b.lastDigestAt, b.sessionExpiresAt)?.getTime() ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return (a.email ?? "").localeCompare(b.email ?? "");
  });

  return rows;
}
