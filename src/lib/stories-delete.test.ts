import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    story: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/inbound/storage", () => ({
  deleteConversations: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { deleteConversations } from "@/lib/inbound/storage";
import {
  permanentlyDeleteStories,
  purgeExpiredDeletedStories,
  restoreStories,
  softDeleteStories,
} from "@/lib/stories-delete";

describe("stories-delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft-deletes active stories", async () => {
    vi.mocked(prisma.story.updateMany).mockResolvedValue({ count: 2 });

    const deleted = await softDeleteStories("ws_1", ["s1", "s2"], "user_1");

    expect(deleted).toBe(2);
    expect(prisma.story.updateMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws_1",
        id: { in: ["s1", "s2"] },
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
        purgeAt: expect.any(Date),
        deletedById: "user_1",
      },
    });
  });

  it("restores deleted stories", async () => {
    vi.mocked(prisma.story.updateMany).mockResolvedValue({ count: 1 });

    const restored = await restoreStories("ws_1", ["s1"]);

    expect(restored).toBe(1);
    expect(prisma.story.updateMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws_1",
        id: { in: ["s1"] },
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
        purgeAt: null,
        deletedById: null,
      },
    });
  });

  it("permanently deletes stories in Recently deleted", async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([
      { conversationId: "c1" },
    ] as never);
    vi.mocked(deleteConversations).mockResolvedValue(1);

    const purged = await permanentlyDeleteStories("ws_1", ["s1"]);

    expect(purged).toBe(1);
    expect(prisma.story.findMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws_1",
        id: { in: ["s1"] },
        deletedAt: { not: null },
      },
      select: { conversationId: true },
    });
    expect(deleteConversations).toHaveBeenCalledWith("ws_1", ["c1"]);
  });

  it("purges expired deleted stories via conversation delete", async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([
      {
        workspaceId: "ws_1",
        conversationId: "c1",
      },
      {
        workspaceId: "ws_1",
        conversationId: "c2",
      },
    ] as never);
    vi.mocked(deleteConversations).mockResolvedValue(2);

    const purged = await purgeExpiredDeletedStories();

    expect(purged).toBe(2);
    expect(deleteConversations).toHaveBeenCalledWith("ws_1", ["c1", "c2"]);
  });
});
