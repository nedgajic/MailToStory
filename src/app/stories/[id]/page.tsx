import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStoryForWorkspace } from "@/lib/stories";
import { markStoryViewed } from "@/lib/story-views";
import type { PlanId } from "@/lib/billing/plans";
import { canUseElaborateStoryLength } from "@/lib/story-length";
import { creditsUsedThisMonth } from "@/lib/billing/generation-limits";
import {
  creditsRemaining,
  formatCredits,
  monthlyCreditAllowance,
} from "@/lib/billing/credits";
import { AppTopBar } from "@/components/app-top-bar";
import { StoryViewTracker } from "@/components/stories/story-view-tracker";
import { StoryDetail } from "./story-detail";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Story — ${BRAND_NAME}` };

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const { id } = await params;
  const story = await getStoryForWorkspace(ctx.workspace.id, id);
  if (!story) notFound();

  await markStoryViewed(session.user.id, id);

  const plan = ctx.workspace.plan as PlanId;
  const [creditsUsed] = await Promise.all([
    creditsUsedThisMonth(ctx.workspace.id),
  ]);
  const allowance = monthlyCreditAllowance(plan, ctx.workspace.seatQuantity);
  const remaining = creditsRemaining(creditsUsed, allowance);
  const creditsRemainingLabel =
    remaining != null ? formatCredits(remaining) : null;

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        plan={ctx.workspace.plan as PlanId}
      />
      <StoryViewTracker />
      <StoryDetail
        storyId={id}
        conversationId={story.conversationId}
        digest={story.digest}
        messageIdsInOrder={story.messageIdsInOrder}
        storyLength={story.storyLength}
        versions={story.versions}
        activeVersionId={story.activeVersionId}
        canUseElaborate={canUseElaborateStoryLength(plan)}
        creditsRemainingLabel={creditsRemainingLabel}
        isFree={plan === "free"}
        deletedAt={story.deletedAt?.toISOString() ?? null}
        purgeAt={story.purgeAt?.toISOString() ?? null}
      />
    </>
  );
}
