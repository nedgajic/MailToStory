import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma";
import { uploadRoot } from "@/lib/inbound/storage";

export type StorageSuggestionLevel = "ok" | "watch" | "action" | "urgent";

export type StorageSuggestion = {
  id: string;
  level: StorageSuggestionLevel;
  title: string;
  detail: string;
};

export type StorageMetrics = {
  collectedAt: string;
  postgresDatabaseBytes: number;
  tableBytes: {
    conversationMessage: number;
    story: number;
    quarantinedInbound: number;
    storyGenerationLog: number;
    conversationAttachmentMeta: number;
  };
  uploadDirBytes: number;
  uploadFileCount: number;
  attachmentBytesOnDisk: number;
  attachmentCount: number;
  counts: {
    users: number;
    workspaces: number;
    stories: number;
    conversations: number;
    messages: number;
    quarantineActive: number;
    quarantineExpired: number;
    generationLogTotal: number;
    generationLogLast30Days: number;
    storiesLast30Days: number;
    activeUsersLast30Days: number;
  };
  estimates: {
    avgStoryFootprintBytes: number;
    estimatedMonthlyStoryVolume: number;
    estimatedMonthlyDbGrowthBytes: number;
    estimatedMonthlyDiskGrowthBytes: number;
  };
  env: {
    uploadDir: string;
    cronSecretConfigured: boolean;
    inboundUploadDirConfigured: boolean;
  };
};

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${Math.round(bytes)} B`;
}

async function directorySize(dir: string): Promise<{ bytes: number; files: number }> {
  let bytes = 0;
  let files = 0;

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        try {
          const info = await stat(full);
          bytes += info.size;
          files += 1;
        } catch {
          /* skip */
        }
      }
    }
  }

  await walk(dir);
  return { bytes, files };
}

async function postgresDatabaseBytes(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ size: bigint | number }>>`
    SELECT pg_database_size(current_database()) AS size
  `;
  const raw = rows[0]?.size ?? 0;
  return Number(raw);
}

async function postgresTableBytes(tableName: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ size: bigint | number }>>(
    `SELECT pg_total_relation_size('"${tableName}"') AS size`,
  );
  const raw = rows[0]?.size ?? 0;
  return Number(raw);
}

export async function collectStorageMetrics(): Promise<StorageMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const uploadDir = uploadRoot();

  const [
    postgresDatabaseBytesValue,
    conversationMessageBytes,
    storyBytes,
    quarantineBytes,
    generationLogBytes,
    attachmentMetaBytes,
    uploadStats,
    users,
    workspaces,
    stories,
    conversations,
    messages,
    quarantineActive,
    quarantineExpired,
    generationLogTotal,
    generationLogLast30Days,
    storiesLast30Days,
    activeUsersLast30Days,
    attachmentAgg,
  ] = await Promise.all([
    postgresDatabaseBytes(),
    postgresTableBytes("ConversationMessage"),
    postgresTableBytes("Story"),
    postgresTableBytes("QuarantinedInbound"),
    postgresTableBytes("StoryGenerationLog"),
    postgresTableBytes("ConversationAttachment"),
    directorySize(uploadDir),
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.story.count(),
    prisma.conversation.count(),
    prisma.conversationMessage.count(),
    prisma.quarantinedInbound.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.quarantinedInbound.count({ where: { expiresAt: { lte: new Date() } } }),
    prisma.storyGenerationLog.count(),
    prisma.storyGenerationLog.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.story.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({
      where: {
        memberships: {
          some: {
            workspace: {
              conversations: {
                some: { story: { createdAt: { gte: thirtyDaysAgo } } },
              },
            },
          },
        },
      },
    }),
    prisma.conversationAttachment.aggregate({ _sum: { size: true }, _count: true }),
  ]);

  const mailAndDigestBytes = conversationMessageBytes + storyBytes;
  const avgStoryFootprintBytes =
    stories > 0 ? Math.round(mailAndDigestBytes / stories) : 0;
  const attachmentBytesOnDisk = uploadStats.bytes;
  const attachmentCount = attachmentAgg._count;
  const avgAttachmentBytes =
    attachmentCount > 0
      ? Math.round((attachmentAgg._sum.size ?? 0) / attachmentCount)
      : 0;

  const estimatedMonthlyStoryVolume = storiesLast30Days;
  const estimatedMonthlyDbGrowthBytes = Math.round(
    storiesLast30Days * avgStoryFootprintBytes * 1.1,
  );
  const estimatedMonthlyDiskGrowthBytes = Math.round(
    storiesLast30Days * (attachmentCount / Math.max(stories, 1)) * avgAttachmentBytes,
  );

  return {
    collectedAt: new Date().toISOString(),
    postgresDatabaseBytes: postgresDatabaseBytesValue,
    tableBytes: {
      conversationMessage: conversationMessageBytes,
      story: storyBytes,
      quarantinedInbound: quarantineBytes,
      storyGenerationLog: generationLogBytes,
      conversationAttachmentMeta: attachmentMetaBytes,
    },
    uploadDirBytes: uploadStats.bytes,
    uploadFileCount: uploadStats.files,
    attachmentBytesOnDisk,
    attachmentCount,
    counts: {
      users,
      workspaces,
      stories,
      conversations,
      messages,
      quarantineActive,
      quarantineExpired,
      generationLogTotal,
      generationLogLast30Days,
      storiesLast30Days,
      activeUsersLast30Days,
    },
    estimates: {
      avgStoryFootprintBytes,
      estimatedMonthlyStoryVolume,
      estimatedMonthlyDbGrowthBytes,
      estimatedMonthlyDiskGrowthBytes,
    },
    env: {
      uploadDir,
      cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
      inboundUploadDirConfigured: Boolean(process.env.INBOUND_UPLOAD_DIR?.trim()),
    },
  };
}

export function buildStorageSuggestions(
  metrics: StorageMetrics,
): StorageSuggestion[] {
  const suggestions: StorageSuggestion[] = [];
  const dbGb = metrics.postgresDatabaseBytes / GB;
  const diskGb = metrics.uploadDirBytes / GB;
  const monthlyDbGb = metrics.estimates.estimatedMonthlyDbGrowthBytes / GB;
  const monthlyDiskGb = metrics.estimates.estimatedMonthlyDiskGrowthBytes / GB;
  const active = metrics.counts.activeUsersLast30Days;

  if (diskGb >= 20) {
    suggestions.push({
      id: "r2-attachments-urgent",
      level: "urgent",
      title: "Move attachments to object storage (R2/S3)",
      detail: `Local uploads are ${formatStorageBytes(metrics.uploadDirBytes)} across ${metrics.uploadFileCount} files. On a shared VPS this competes with Postgres and other apps — migrate attachment reads/writes to Cloudflare R2 first.`,
    });
  } else if (diskGb >= 10 || (active >= 300 && diskGb >= 5)) {
    suggestions.push({
      id: "r2-attachments-watch",
      level: "action",
      title: "Plan attachment offload to R2/S3",
      detail: `Uploads folder is ${formatStorageBytes(metrics.uploadDirBytes)} with ${metrics.attachmentCount} tracked attachments. Consider R2 before you pass ~500 active users or 20 GB local disk.`,
    });
  }

  if (dbGb >= 50) {
    suggestions.push({
      id: "managed-postgres-urgent",
      level: "urgent",
      title: "Move Postgres off the app VPS",
      detail: `Database is ${formatStorageBytes(metrics.postgresDatabaseBytes)}. Use managed Postgres (Neon, Supabase, RDS) and keep the VPS for the Next.js app only.`,
    });
  } else if (dbGb >= 30) {
    suggestions.push({
      id: "managed-postgres-action",
      level: "action",
      title: "Evaluate managed Postgres",
      detail: `Database is ${formatStorageBytes(metrics.postgresDatabaseBytes)}. Backups and migrations on a shared VPS get risky above ~30 GB.`,
    });
  }

  if (dbGb >= 20 || monthlyDbGb >= 2) {
    suggestions.push({
      id: "trim-html-in-db",
      level: dbGb >= 30 ? "urgent" : "action",
      title: "Reduce mail HTML stored in Postgres",
      detail: `ConversationMessage uses ${formatStorageBytes(metrics.tableBytes.conversationMessage)} and Story uses ${formatStorageBytes(metrics.tableBytes.story)}. Truncate htmlBody at ingest or archive raw mail after story generation — this usually saves more space than moving attachments alone.`,
    });
  }

  if (monthlyDbGb >= 1.5 && dbGb < 20) {
    suggestions.push({
      id: "db-growth-watch",
      level: "watch",
      title: "Database growth is accelerating",
      detail: `Estimated ~${formatStorageBytes(metrics.estimates.estimatedMonthlyDbGrowthBytes)}/month from ${metrics.counts.storiesLast30Days} new stories (avg ${formatStorageBytes(metrics.estimates.avgStoryFootprintBytes)} mail+digest per story).`,
    });
  }

  if (metrics.counts.quarantineExpired > 0) {
    suggestions.push({
      id: "quarantine-cleanup",
      level: "watch",
      title: "Run quarantine cleanup",
      detail: `${metrics.counts.quarantineExpired} expired quarantine row(s) remain. Schedule GET /api/cron/quarantine-cleanup daily${metrics.env.cronSecretConfigured ? "" : " and set CRON_SECRET in .env"}.`,
    });
  }

  if (!metrics.env.cronSecretConfigured) {
    suggestions.push({
      id: "cron-secret",
      level: "watch",
      title: "Configure CRON_SECRET",
      detail: "Set CRON_SECRET so quarantine cleanup and other maintenance crons can run securely.",
    });
  }

  if (metrics.tableBytes.storyGenerationLog > 500 * MB) {
    suggestions.push({
      id: "generation-log-retention",
      level: "action",
      title: "Add retention for StoryGenerationLog",
      detail: `Generation log table is ${formatStorageBytes(metrics.tableBytes.storyGenerationLog)} (${metrics.counts.generationLogTotal} rows). Purge rows older than 90 days to keep rate-limit history without unbounded growth.`,
    });
  }

  if (active >= 1000 && diskGb < 10 && dbGb < 20) {
    suggestions.push({
      id: "scale-healthy",
      level: "ok",
      title: "Storage headroom looks healthy",
      detail: `${active} active users (30d) with ${formatStorageBytes(metrics.postgresDatabaseBytes)} DB and ${formatStorageBytes(metrics.uploadDirBytes)} uploads. Re-check when uploads exceed 10 GB or DB exceeds 20 GB.`,
    });
  }

  if (active >= 2000 && (dbGb >= 15 || diskGb >= 15)) {
    suggestions.push({
      id: "two-k-users",
      level: "action",
      title: "2k+ active users — split storage layers",
      detail: `At ${active} active users, target architecture is R2 for attachments + managed Postgres + optional HTML trimming. Projected monthly growth ~${formatStorageBytes(metrics.estimates.estimatedMonthlyDbGrowthBytes)} DB / ~${formatStorageBytes(metrics.estimates.estimatedMonthlyDiskGrowthBytes)} disk.`,
    });
  }

  if (monthlyDiskGb >= 5 && diskGb < 10) {
    suggestions.push({
      id: "disk-growth-watch",
      level: "watch",
      title: "Attachment volume rising",
      detail: `Estimated ~${formatStorageBytes(metrics.estimates.estimatedMonthlyDiskGrowthBytes)}/month to local uploads from recent story volume.`,
    });
  }

  if (metrics.tableBytes.quarantinedInbound > 200 * MB) {
    suggestions.push({
      id: "quarantine-volume",
      level: "action",
      title: "High quarantine volume",
      detail: `Quarantine table is ${formatStorageBytes(metrics.tableBytes.quarantinedInbound)} (${metrics.counts.quarantineActive} active). Review allowlist abuse or shorten QUARANTINE_RETENTION_DAYS.`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "all-clear",
      level: "ok",
      title: "No immediate storage actions",
      detail: `Database ${formatStorageBytes(metrics.postgresDatabaseBytes)}, uploads ${formatStorageBytes(metrics.uploadDirBytes)}, ${active} active users (30d).`,
    });
  }

  const levelOrder: Record<StorageSuggestionLevel, number> = {
    urgent: 0,
    action: 1,
    watch: 2,
    ok: 3,
  };

  return suggestions.sort(
    (a, b) => levelOrder[a.level] - levelOrder[b.level],
  );
}

export async function getAdminStorageReport(): Promise<{
  metrics: StorageMetrics;
  suggestions: StorageSuggestion[];
}> {
  const metrics = await collectStorageMetrics();
  const suggestions = buildStorageSuggestions(metrics);
  return { metrics, suggestions };
}
