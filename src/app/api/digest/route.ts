import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { generateAndSaveStory } from "@/lib/inbound/ingest";
import { evaluateGenerationGate } from "@/lib/billing/generation-limits";
import { parsePlanId } from "@/lib/billing/plans";
import { listStoryVersions } from "@/lib/story-versions";
import { parseStoryLength } from "@/lib/story-length";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { conversationId?: string; length?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const conversationId = body.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }
  const storyLength = parseStoryLength(body.length);

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId: ctx.workspace.id },
    include: { story: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasExistingStory = Boolean(conversation.story);

  const gate = await evaluateGenerationGate({
    plan: parsePlanId(ctx.workspace.plan),
    workspaceId: ctx.workspace.id,
    conversationId,
    seatQuantity: ctx.workspace.seatQuantity,
    hasExistingStory,
    manualRefresh: true,
    storyLength,
  });
  if (!gate.allowed) {
    const status =
      gate.reason === "free_story_quota" ||
      gate.reason === "elaborate_not_allowed" ||
      gate.reason === "insufficient_credits"
        ? 402
        : 429;
    return NextResponse.json({ error: gate.message ?? "Generation blocked." }, { status });
  }

  try {
    const digest = await generateAndSaveStory(conversationId, { length: storyLength });
    const story = await prisma.story.findUnique({
      where: { conversationId },
      select: {
        id: true,
        messageIdsInOrder: true,
        storyLength: true,
        activeVersionId: true,
      },
    });
    const messageIdsInOrder = Array.isArray(story?.messageIdsInOrder)
      ? story.messageIdsInOrder.filter((x): x is string => typeof x === "string")
      : [];
    const versions = story?.id
      ? await listStoryVersions(story.id, story.activeVersionId)
      : [];
    return NextResponse.json({
      digest,
      storyId: story?.id,
      messageIdsInOrder,
      storyLength: story?.storyLength ?? storyLength,
      activeVersionId: story?.activeVersionId ?? null,
      versions,
    });
  } catch (error) {
    console.error("digest", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate story" },
      { status: 502 },
    );
  }
}
