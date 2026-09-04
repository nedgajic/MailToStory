import prisma from "@/lib/prisma";
import { parseStoryLength, type StoryLength } from "@/lib/story-length";

export type StoryLengthCounts = Record<StoryLength, number>;

export type AdminGenerationStats = {
  totalGenerations: number;
  initialGenerations: number;
  regenerations: number;
  totalGenerationsLast30Days: number;
  regenerationsLast30Days: number;
  regenerationsLast7Days: number;
  regenerationsByLength: StoryLengthCounts;
  regenerationsByLengthLast30Days: StoryLengthCounts;
  storiesWithRegenerations: number;
  avgRegenerationsPerRegeneratedStory: number;
  currentStoryLength: StoryLengthCounts;
};

export function emptyStoryLengthCounts(): StoryLengthCounts {
  return { concise: 0, normal: 0, elaborate: 0 };
}

export function storyLengthCountsFromRows(
  rows: Array<{ storyLength: string; count: number }>,
): StoryLengthCounts {
  const counts = emptyStoryLengthCounts();
  for (const row of rows) {
    counts[parseStoryLength(row.storyLength)] += row.count;
  }
  return counts;
}

export function regenerationMetrics(input: {
  totalGenerations: number;
  distinctConversations: number;
  storiesWithRegenerations: number;
  regenerations: number;
}): Pick<
  AdminGenerationStats,
  "initialGenerations" | "regenerations" | "avgRegenerationsPerRegeneratedStory"
> {
  const initialGenerations = input.distinctConversations;
  const regenerations = Math.max(0, input.regenerations);
  const avgRegenerationsPerRegeneratedStory =
    input.storiesWithRegenerations > 0
      ? Math.round((regenerations / input.storiesWithRegenerations) * 10) / 10
      : 0;

  return {
    initialGenerations,
    regenerations,
    avgRegenerationsPerRegeneratedStory,
  };
}

async function countRegenerations(since?: Date): Promise<number> {
  if (!since) {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT ROW_NUMBER() OVER (
          PARTITION BY "conversationId" ORDER BY "createdAt" ASC
        ) AS rn
        FROM "StoryGenerationLog"
      ) numbered
      WHERE rn > 1
    `;
    return rows[0]?.count ?? 0;
  }

  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT
        "createdAt",
        ROW_NUMBER() OVER (
          PARTITION BY "conversationId" ORDER BY "createdAt" ASC
        ) AS rn
      FROM "StoryGenerationLog"
    ) numbered
    WHERE rn > 1 AND "createdAt" >= ${since}
  `;
  return rows[0]?.count ?? 0;
}

async function countRegenerationsByLength(since?: Date): Promise<StoryLengthCounts> {
  const rows = since
    ? await prisma.$queryRaw<Array<{ storyLength: string; count: number }>>`
        SELECT "storyLength", COUNT(*)::int AS count
        FROM (
          SELECT
            "storyLength",
            "createdAt",
            ROW_NUMBER() OVER (
              PARTITION BY "conversationId" ORDER BY "createdAt" ASC
            ) AS rn
          FROM "StoryGenerationLog"
        ) numbered
        WHERE rn > 1 AND "createdAt" >= ${since}
        GROUP BY "storyLength"
      `
    : await prisma.$queryRaw<Array<{ storyLength: string; count: number }>>`
        SELECT "storyLength", COUNT(*)::int AS count
        FROM (
          SELECT
            "storyLength",
            ROW_NUMBER() OVER (
              PARTITION BY "conversationId" ORDER BY "createdAt" ASC
            ) AS rn
          FROM "StoryGenerationLog"
        ) numbered
        WHERE rn > 1
        GROUP BY "storyLength"
      `;

  return storyLengthCountsFromRows(rows);
}

async function currentStoryLengthCounts(): Promise<StoryLengthCounts> {
  const rows = await prisma.story.groupBy({
    by: ["storyLength"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  return storyLengthCountsFromRows(
    rows.map((row) => ({
      storyLength: row.storyLength,
      count: row._count._all,
    })),
  );
}

export async function getAdminGenerationStats(): Promise<AdminGenerationStats> {
  const now = Date.now();
  const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalGenerations,
    totalGenerationsLast30Days,
    distinctConversations,
    storiesWithRegenerations,
    regenerations,
    regenerationsLast30Days,
    regenerationsLast7Days,
    regenerationsByLengthAllTime,
    regenerationsByLengthLast30Days,
    currentStoryLength,
  ] = await Promise.all([
    prisma.storyGenerationLog.count(),
    prisma.storyGenerationLog.count({
      where: { createdAt: { gte: last30Days } },
    }),
    prisma.storyGenerationLog.findMany({
      distinct: ["conversationId"],
      select: { conversationId: true },
    }).then((rows) => rows.length),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT "conversationId"
        FROM "StoryGenerationLog"
        GROUP BY "conversationId"
        HAVING COUNT(*) > 1
      ) repeated
    `.then((rows) => rows[0]?.count ?? 0),
    countRegenerations(),
    countRegenerations(last30Days),
    countRegenerations(last7Days),
    countRegenerationsByLength(),
    countRegenerationsByLength(last30Days),
    currentStoryLengthCounts(),
  ]);

  const derived = regenerationMetrics({
    totalGenerations,
    distinctConversations,
    storiesWithRegenerations,
    regenerations,
  });

  return {
    totalGenerations,
    totalGenerationsLast30Days,
    regenerationsLast30Days,
    regenerationsLast7Days,
    regenerationsByLength: regenerationsByLengthAllTime,
    regenerationsByLengthLast30Days,
    currentStoryLength,
    storiesWithRegenerations,
    ...derived,
  };
}

export async function getGenerationCountsByWorkspace(): Promise<
  Map<string, { generations: number; regenerations: number }>
> {
  const [generationRows, regenerationRows] = await Promise.all([
    prisma.storyGenerationLog.groupBy({
      by: ["workspaceId"],
      _count: { _all: true },
    }),
    prisma.$queryRaw<Array<{ workspaceId: string; count: number }>>`
      SELECT "workspaceId", COUNT(*)::int AS count
      FROM (
        SELECT
          "workspaceId",
          ROW_NUMBER() OVER (
            PARTITION BY "conversationId" ORDER BY "createdAt" ASC
          ) AS rn
        FROM "StoryGenerationLog"
      ) numbered
      WHERE rn > 1
      GROUP BY "workspaceId"
    `,
  ]);

  const map = new Map<string, { generations: number; regenerations: number }>();
  for (const row of generationRows) {
    map.set(row.workspaceId, {
      generations: row._count._all,
      regenerations: 0,
    });
  }
  for (const row of regenerationRows) {
    const current = map.get(row.workspaceId) ?? { generations: 0, regenerations: 0 };
    current.regenerations = row.count;
    map.set(row.workspaceId, current);
  }
  return map;
}

export function countWorkspaceGenerations(
  workspaceIds: string[],
  countsByWorkspace: Map<string, { generations: number; regenerations: number }>,
): { generations: number; regenerations: number } {
  let generations = 0;
  let regenerations = 0;
  for (const workspaceId of workspaceIds) {
    const row = countsByWorkspace.get(workspaceId);
    if (!row) continue;
    generations += row.generations;
    regenerations += row.regenerations;
  }
  return { generations, regenerations };
}
