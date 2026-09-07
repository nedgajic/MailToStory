import type { WorkspaceContext } from "@/lib/session";
import { isWorkspaceAdmin } from "@/lib/session";
import { normalizeEmail } from "@/lib/password";
import { parsePlanId } from "@/lib/billing/plans";

export function canManageAllQuarantine(role: WorkspaceContext["role"]): boolean {
  return isWorkspaceAdmin(role);
}

/** Team members may approve/dismiss held mail sent from their own account email. */
export function canActOnQuarantineSender(
  ctx: WorkspaceContext,
  fromEmail: string,
): boolean {
  if (isWorkspaceAdmin(ctx.role)) return true;
  if (parsePlanId(ctx.workspace.plan) !== "team") return false;
  if (!ctx.email) return false;
  return normalizeEmail(ctx.email) === normalizeEmail(fromEmail);
}

export function quarantineSenderFilter(ctx: WorkspaceContext): {
  fromEmail?: string;
} {
  if (canManageAllQuarantine(ctx.role)) return {};
  if (parsePlanId(ctx.workspace.plan) !== "team" || !ctx.email) {
    return { fromEmail: "__none__" };
  }
  return { fromEmail: normalizeEmail(ctx.email) };
}
