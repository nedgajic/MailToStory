import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import { getStoryForWorkspace } from "@/lib/stories";
import { markStoryViewed } from "@/lib/story-views";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const story = await getStoryForWorkspace(ctx.workspace.id, id);
  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await markStoryViewed(session.user.id, id);
  return NextResponse.json({ ok: true });
}
