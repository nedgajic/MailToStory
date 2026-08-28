import { describe, expect, it } from "vitest";
import {
  buildStorageSuggestions,
  formatStorageBytes,
  type StorageMetrics,
} from "@/lib/admin/storage-metrics";

const GB = 1024 * 1024 * 1024;

function baseMetrics(overrides: Partial<StorageMetrics> = {}): StorageMetrics {
  return {
    collectedAt: new Date().toISOString(),
    postgresDatabaseBytes: 2 * GB,
    tableBytes: {
      conversationMessage: 1 * GB,
      story: 500 * 1024 * 1024,
      quarantinedInbound: 10 * 1024 * 1024,
      storyGenerationLog: 50 * 1024 * 1024,
      conversationAttachmentMeta: 5 * 1024 * 1024,
    },
    uploadDirBytes: 3 * GB,
    uploadFileCount: 1200,
    attachmentBytesOnDisk: 3 * GB,
    attachmentCount: 1200,
    counts: {
      users: 400,
      workspaces: 400,
      stories: 8000,
      conversations: 8000,
      messages: 12000,
      quarantineActive: 2,
      quarantineExpired: 0,
      generationLogTotal: 10000,
      generationLogLast30Days: 800,
      storiesLast30Days: 800,
      activeUsersLast30Days: 250,
    },
    estimates: {
      avgStoryFootprintBytes: 180 * 1024,
      estimatedMonthlyStoryVolume: 800,
      estimatedMonthlyDbGrowthBytes: 150 * 1024 * 1024,
      estimatedMonthlyDiskGrowthBytes: 60 * 1024 * 1024,
    },
    env: {
      uploadDir: "/var/www/mailtostory/uploads",
      cronSecretConfigured: true,
      inboundUploadDirConfigured: true,
    },
    ...overrides,
  };
}

describe("formatStorageBytes", () => {
  it("formats gigabytes", () => {
    expect(formatStorageBytes(GB)).toBe("1.00 GB");
  });
});

describe("buildStorageSuggestions", () => {
  it("recommends R2 when uploads exceed 20 GB", () => {
    const suggestions = buildStorageSuggestions(
      baseMetrics({ uploadDirBytes: 25 * GB }),
    );
    expect(suggestions.some((s) => s.id === "r2-attachments-urgent")).toBe(true);
  });

  it("recommends managed postgres when database exceeds 50 GB", () => {
    const suggestions = buildStorageSuggestions(
      baseMetrics({ postgresDatabaseBytes: 55 * GB }),
    );
    expect(suggestions.some((s) => s.id === "managed-postgres-urgent")).toBe(
      true,
    );
  });

  it("flags expired quarantine rows", () => {
    const suggestions = buildStorageSuggestions(
      baseMetrics({
        counts: {
          ...baseMetrics().counts,
          quarantineExpired: 12,
        },
      }),
    );
    expect(suggestions.some((s) => s.id === "quarantine-cleanup")).toBe(true);
  });

  it("returns ok when footprint is small", () => {
    const suggestions = buildStorageSuggestions(
      baseMetrics({
        postgresDatabaseBytes: 500 * 1024 * 1024,
        uploadDirBytes: 100 * 1024 * 1024,
      }),
    );
    expect(suggestions.some((s) => s.level === "ok")).toBe(true);
  });
});
