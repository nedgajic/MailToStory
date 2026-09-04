import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import prisma from "@/lib/prisma";
import { parseStoryLength, STORY_LENGTHS } from "@/lib/story-length";
import { canUseElaborateStoryLength } from "@/lib/story-length";
import { parsePlanId } from "@/lib/billing/plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: ctx.workspace.id },
    select: { defaultStoryLength: true },
  });

  return NextResponse.json({
    defaultStoryLength: parseStoryLength(workspace?.defaultStoryLength),
    canUseElaborate: canUseElaborateStoryLength(parsePlanId(ctx.workspace.plan)),
    canManage: isWorkspaceAdmin(ctx.role),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { defaultStoryLength?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const length = parseStoryLength(body.defaultStoryLength);
  if (!STORY_LENGTHS.includes(length)) {
    return NextResponse.json({ error: "Invalid story length." }, { status: 400 });
  }

  const plan = parsePlanId(ctx.workspace.plan);
  if (length === "elaborate" && !canUseElaborateStoryLength(plan)) {
    return NextResponse.json(
      { error: "Elaborate default length requires a Pro or Team plan." },
      { status: 402 },
    );
  }

  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: { defaultStoryLength: length },
  });

  return NextResponse.json({ defaultStoryLength: length });
}
