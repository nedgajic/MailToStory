import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    storyAccessToken: { deleteMany: vi.fn() },
    storyGenerationLog: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/inbound/quarantine", () => ({
  cleanupExpiredQuarantine: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { cleanupExpiredQuarantine } from "@/lib/inbound/quarantine";
import { generationLogRetentionDays, runMaintenance } from "@/lib/cron/maintenance";

describe("runMaintenance", () => {
  beforeEach(() => {
    vi.mocked(cleanupExpiredQuarantine).mockResolvedValue(2);
    vi.mocked(prisma.storyAccessToken.deleteMany).mockResolvedValue({ count: 3 });
    vi.mocked(prisma.storyGenerationLog.deleteMany).mockResolvedValue({ count: 4 });
  });

  it("purges quarantine, tokens, and old generation logs", async () => {
    const result = await runMaintenance();
    expect(result).toEqual({
      quarantineDeleted: 2,
      accessTokensDeleted: 3,
      generationLogDeleted: 4,
    });
    expect(prisma.storyGenerationLog.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          lt: expect.any(Date),
        },
      },
    });
  });

  it("defaults generation log retention to 90 days", () => {
    delete process.env.GENERATION_LOG_RETENTION_DAYS;
    expect(generationLogRetentionDays()).toBe(90);
  });
});
