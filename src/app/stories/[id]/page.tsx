import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getStoryForWorkspace } from "@/lib/stories";
import type { PlanId } from "@/lib/billing/plans";
import { AppTopBar } from "@/components/app-top-bar";
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

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        plan={ctx.workspace.plan as PlanId}
      />
      <StoryDetail
        storyId={id}
        conversationId={story.conversationId}
        digest={story.digest}
        messageIdsInOrder={story.messageIdsInOrder}
        isFree={ctx.workspace.plan === "free"}
        deletedAt={story.deletedAt?.toISOString() ?? null}
        purgeAt={story.purgeAt?.toISOString() ?? null}
      />
    </>
  );
}
