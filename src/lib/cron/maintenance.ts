import prisma from "@/lib/prisma";
import { cleanupExpiredQuarantine } from "@/lib/inbound/quarantine";

const DEFAULT_GENERATION_LOG_RETENTION_DAYS = 90;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function generationLogRetentionDays(): number {
  return parsePositiveInt(
    process.env.GENERATION_LOG_RETENTION_DAYS,
    DEFAULT_GENERATION_LOG_RETENTION_DAYS,
  );
}

export type MaintenanceResult = {
  quarantineDeleted: number;
  accessTokensDeleted: number;
  generationLogDeleted: number;
};

export async function runMaintenance(): Promise<MaintenanceResult> {
  const [quarantineDeleted, accessTokens, generationLog] = await Promise.all([
    cleanupExpiredQuarantine(),
    prisma.storyAccessToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    }),
    prisma.storyGenerationLog.deleteMany({
      where: {
        createdAt: {
          lt: new Date(
            Date.now() - generationLogRetentionDays() * 24 * 60 * 60 * 1000,
          ),
        },
      },
    }),
  ]);

  return {
    quarantineDeleted,
    accessTokensDeleted: accessTokens.count,
    generationLogDeleted: generationLog.count,
  };
}
