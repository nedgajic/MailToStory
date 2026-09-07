import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import prisma from "@/lib/prisma";

export async function requireSettingsPageContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");

  const canManageTeam = isWorkspaceAdmin(ctx.role);
  const plan = ctx.workspace.plan as PlanId;

  const [hasGoogleAccount, userPrefs, workspacePrefs] = await Promise.all([
    prisma.account.findFirst({
      where: { userId: ctx.userId, provider: "google" },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { twoFactorEnabled: true, image: true },
    }),
    prisma.workspace.findUnique({
      where: { id: ctx.workspace.id },
      select: { defaultStoryLength: true },
    }),
  ]);

  return {
    ctx,
    canManageTeam,
    plan,
    hasGoogleAccount: Boolean(hasGoogleAccount),
    twoFactorEnabled: Boolean(userPrefs?.twoFactorEnabled),
    image: userPrefs?.image ?? null,
    workspacePrefs,
  };
}
