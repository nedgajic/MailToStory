import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { generateAndSaveStory } from "@/lib/inbound/ingest";
import { evaluateGenerationGate } from "@/lib/billing/generation-limits";
import { parsePlanId } from "@/lib/billing/plans";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const conversationId = body.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

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
  });
  if (!gate.allowed) {
    const status = gate.reason === "free_story_quota" ? 402 : 429;
    return NextResponse.json({ error: gate.message ?? "Generation blocked." }, { status });
  }

  try {
    const digest = await generateAndSaveStory(conversationId);
    const story = await prisma.story.findUnique({
      where: { conversationId },
      select: { id: true, messageIdsInOrder: true },
    });
    const messageIdsInOrder = Array.isArray(story?.messageIdsInOrder)
      ? story.messageIdsInOrder.filter((x): x is string => typeof x === "string")
      : [];
    return NextResponse.json({
      digest,
      storyId: story?.id,
      messageIdsInOrder,
    });
  } catch (error) {
    console.error("digest", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate story" },
      { status: 502 },
    );
  }
}
