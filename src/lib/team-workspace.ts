import type { PlanId } from "@/lib/billing/plans";
import {
  setupTeamWorkspace,
  teamWorkspaceErrorMessage,
  updateWorkspaceName,
} from "@/lib/workspace";

export type TeamOnboardingInput = {
  teamName?: string;
  inboxSlug?: string;
};

export async function applyTeamOnboardingIfNeeded(
  workspaceId: string,
  currentPlan: PlanId,
  targetPlan: PlanId,
  input: TeamOnboardingInput,
): Promise<void> {
  if (targetPlan !== "team") return;

  const teamName = input.teamName?.trim() ?? "";
  const inboxSlug = input.inboxSlug?.trim() ?? "";
  const isFirstTeam = currentPlan !== "team";

  if (isFirstTeam) {
    if (!teamName || !inboxSlug) {
      throw new Error("TEAM_ONBOARDING_REQUIRED");
    }
    await setupTeamWorkspace(workspaceId, { teamName, inboxSlug });
    return;
  }

  if (teamName) {
    await updateWorkspaceName(workspaceId, teamName);
  }
}

export function teamOnboardingErrorMessage(code: string): string {
  if (code === "TEAM_ONBOARDING_REQUIRED") {
    return "Enter a team name and shared inbox address.";
  }
  return teamWorkspaceErrorMessage(code);
}
