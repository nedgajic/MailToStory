import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import { defaultSettingsPath } from "@/lib/settings-nav";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");

  const canManageTeam = isWorkspaceAdmin(ctx.role);
  const plan = ctx.workspace.plan as PlanId;
  redirect(defaultSettingsPath({ canManageTeam, plan }));
}
