import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import type { MemberRole, PlanId } from "@/lib/billing/plans";
import { parsePlanId } from "@/lib/billing/plans";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export type WorkspaceContext = {
  userId: string;
  email: string | null;
  name: string | null;
  emailVerified: Date | null;
  hasPassword: boolean;
  workspace: {
    id: string;
    name: string;
    plan: PlanId;
    inboundLocalPart: string;
    seatQuantity: number;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    cancelAtPeriodEnd: boolean;
    billingPastDue: boolean;
    currentPeriodEnd: Date | null;
    currentPeriodStart: Date | null;
  };
  role: MemberRole;
  notifyStoryReady: boolean;
};

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) {
    throw new Error("UNAUTHORIZED");
  }
  return id;
}

export function isWorkspaceAdmin(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}

export async function getWorkspaceContext(
  userId: string,
): Promise<WorkspaceContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      passwordHash: true,
      activeWorkspaceId: true,
    },
  });
  if (!user) return null;

  let workspaceId = user.activeWorkspaceId;
  if (!workspaceId) {
    workspaceId = await ensureWorkspaceForUser({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: user.id },
    },
    include: { workspace: true },
  });

  if (!membership || membership.status !== "active") {
    const fallback = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, status: "active" },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    if (!fallback) return null;
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: fallback.workspaceId },
    });
    return toContext(user, fallback);
  }

  return toContext(user, membership);
}

function toContext(
  user: {
    id: string;
    email: string | null;
    name: string | null;
    emailVerified: Date | null;
    passwordHash: string | null;
  },
  membership: {
    role: string;
    notifyStoryReady: boolean;
    workspace: {
      id: string;
      name: string;
      plan: string;
      inboundLocalPart: string;
      seatQuantity: number;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      stripePriceId: string | null;
      cancelAtPeriodEnd: boolean;
      billingPastDue: boolean;
      currentPeriodEnd: Date | null;
      currentPeriodStart: Date | null;
    };
  },
): WorkspaceContext {
  const role: MemberRole =
    membership.role === "owner" || membership.role === "admin"
      ? membership.role
      : "member";
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    hasPassword: Boolean(user.passwordHash),
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      plan: parsePlanId(membership.workspace.plan),
      inboundLocalPart: membership.workspace.inboundLocalPart,
      seatQuantity: membership.workspace.seatQuantity,
      stripeCustomerId: membership.workspace.stripeCustomerId,
      stripeSubscriptionId: membership.workspace.stripeSubscriptionId,
      stripePriceId: membership.workspace.stripePriceId,
      cancelAtPeriodEnd: membership.workspace.cancelAtPeriodEnd,
      billingPastDue: membership.workspace.billingPastDue,
      currentPeriodEnd: membership.workspace.currentPeriodEnd,
      currentPeriodStart: membership.workspace.currentPeriodStart,
    },
    role,
    notifyStoryReady: membership.notifyStoryReady,
  };
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function readBasicAuth(req: NextRequest): {
  user: string;
  password: string;
} | null {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}
