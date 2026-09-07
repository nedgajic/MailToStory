const DEFAULT_DELETED_STORY_RETENTION_DAYS = 30;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function deletedStoryRetentionDays(): number {
  return parsePositiveInt(
    process.env.DELETED_STORY_RETENTION_DAYS,
    DEFAULT_DELETED_STORY_RETENTION_DAYS,
  );
}

export function purgeAtForDeletedStory(
  deletedAt: Date = new Date(),
  retentionDays = deletedStoryRetentionDays(),
): Date {
  return new Date(deletedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
}

export function daysUntilPurge(purgeAt: Date, now = new Date()): number {
  const ms = purgeAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export const ACTIVE_STORY_WHERE = { deletedAt: null } as const;

export const DELETED_STORY_WHERE = { deletedAt: { not: null } } as const;
