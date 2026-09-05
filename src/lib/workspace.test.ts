import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    workspace: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { setupTeamWorkspace, updateWorkspaceName } from "@/lib/workspace";

describe("updateWorkspaceName", () => {
  it("updates name without changing inbound local part", async () => {
    vi.mocked(prisma.workspace.update).mockResolvedValue({
      name: "Acme Corp",
      inboundLocalPart: "northwind",
    } as Awaited<ReturnType<typeof prisma.workspace.update>>);

    const result = await updateWorkspaceName("ws-1", "Acme Corp");

    expect(result).toEqual({ name: "Acme Corp", inboundLocalPart: "northwind" });
    expect(prisma.workspace.update).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { name: "Acme Corp" },
      select: { name: true, inboundLocalPart: true },
    });
  });
});

describe("setupTeamWorkspace", () => {
  it("claims inbox slug on first team setup", async () => {
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.workspace.update).mockResolvedValue({
      name: "Northwind Legal",
      inboundLocalPart: "northwind",
    } as Awaited<ReturnType<typeof prisma.workspace.update>>);

    const result = await setupTeamWorkspace("ws-1", {
      teamName: "Northwind Legal",
      inboxSlug: "northwind",
    });

    expect(result.inboundLocalPart).toBe("northwind");
    expect(prisma.workspace.update).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { name: "Northwind Legal", inboundLocalPart: "northwind" },
      select: { name: true, inboundLocalPart: true },
    });
  });

  it("rejects taken slugs", async () => {
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: "other",
    } as Awaited<ReturnType<typeof prisma.workspace.findFirst>>);

    await expect(
      setupTeamWorkspace("ws-1", {
        teamName: "Northwind Legal",
        inboxSlug: "northwind",
      }),
    ).rejects.toThrow("INBOX_SLUG_TAKEN");
  });
});
