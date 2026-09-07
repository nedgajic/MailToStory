import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    authRateLimit: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";

describe("checkAuthRateLimit", () => {
  beforeEach(() => {
    vi.mocked(prisma.authRateLimit.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.authRateLimit.upsert).mockResolvedValue({
      key: "test",
      hitsJson: "[]",
      updatedAt: new Date(),
    });
  });

  it("allows requests under the limit", async () => {
    await expect(checkAuthRateLimit("login:ip:1.2.3.4", 3, 60_000)).resolves.toBe(
      true,
    );
    await expect(checkAuthRateLimit("login:ip:1.2.3.4", 3, 60_000)).resolves.toBe(
      true,
    );
  });

  it("blocks once the limit is reached", async () => {
    const now = Date.now();
    vi.mocked(prisma.authRateLimit.findUnique).mockResolvedValue({
      key: "login:ip:1.2.3.4",
      hitsJson: JSON.stringify([
        new Date(now - 1000).toISOString(),
        new Date(now - 2000).toISOString(),
        new Date(now - 3000).toISOString(),
      ]),
      updatedAt: new Date(),
    });

    await expect(checkAuthRateLimit("login:ip:1.2.3.4", 3, 60_000)).resolves.toBe(
      false,
    );
  });
});
