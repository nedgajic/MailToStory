import prisma from "@/lib/prisma";

export type AdminUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  digestCount: number;
  uniqueThreads: number;
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
  const [totalUsers, usersWithDigests, activeSessions, totalDigests] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { memberships: { some: { workspace: { conversations: { some: { story: { isNot: null } } } } } } },
      }),
      prisma.session.count({
        where: { expires: { gt: new Date() } },
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
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      digestCount,
      uniqueThreads: digestCount,
      firstDigestAt,
      lastDigestAt,
      activeSession: sessionExpiresAt !== null,
      sessionExpiresAt,
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
