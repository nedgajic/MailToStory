import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";

export function inboundDomain(): string {
  return (
    process.env.POSTMARK_INBOUND_DOMAIN?.trim() || "inbox.mailtostory.com"
  );
}

export function inboundAddress(localPart: string): string {
  return `${localPart}@${inboundDomain()}`;
}

function randomLocalPart(): string {
  return randomBytes(4).toString("hex");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newRawToken(): string {
  return randomBytes(32).toString("hex");
}

export async function ensureWorkspaceForUser(input: {
  userId: string;
  name?: string | null;
  email?: string | null;
}): Promise<string> {
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: input.userId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { activeWorkspaceId: existing.workspaceId },
    });
    return existing.workspaceId;
  }

  const label =
    input.name?.trim() ||
    input.email?.split("@")[0]?.trim() ||
    "My workspace";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inboundLocalPart = randomLocalPart();
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: `${label}'s workspace`,
          plan: "free",
          inboundLocalPart,
          seatQuantity: 1,
          members: {
            create: {
              userId: input.userId,
              role: "owner",
              status: "active",
            },
          },
        },
      });
      await prisma.user.update({
        where: { id: input.userId },
        data: { activeWorkspaceId: workspace.id },
      });
      return workspace.id;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code !== "P2002") throw error;
    }
  }

  throw new Error("Could not allocate an inbound address.");
}

export function utcMonthRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return { start, end };
}
