import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
      },
    },
    select: { notifyStoryReady: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ notifyStoryReady: membership.notifyStoryReady });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { notifyStoryReady?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.notifyStoryReady !== "boolean") {
    return NextResponse.json(
      { error: "notifyStoryReady must be a boolean." },
      { status: 400 },
    );
  }

  await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
      },
    },
    data: { notifyStoryReady: body.notifyStoryReady },
  });

  return NextResponse.json({ ok: true, notifyStoryReady: body.notifyStoryReady });
}
