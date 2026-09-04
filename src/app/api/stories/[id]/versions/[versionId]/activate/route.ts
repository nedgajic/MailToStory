import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { activateStoryVersion } from "@/lib/story-versions";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: storyId, versionId } = await params;
  const story = await prisma.story.findFirst({
    where: { id: storyId, workspaceId: ctx.workspace.id },
    select: { id: true },
  });
  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const activated = await activateStoryVersion(storyId, versionId);
    return NextResponse.json({
      digest: activated.digest,
      messageIdsInOrder: activated.messageIdsInOrder,
      storyLength: activated.storyLength,
      title: activated.title,
      activeVersionId: versionId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_NOT_FOUND") {
      return NextResponse.json({ error: "Version not found." }, { status: 404 });
    }
    throw error;
  }
}
