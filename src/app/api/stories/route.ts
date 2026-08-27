import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { utcMonthRange } from "@/lib/workspace";
import { deleteConversations } from "@/lib/inbound/storage";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const group = searchParams.get("group") ?? "month";
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 80));

  const { start, end } = utcMonthRange();
  const where = {
    workspaceId: ctx.workspace.id,
    ...(q
      ? { searchText: { contains: q.toLowerCase(), mode: "insensitive" as const } }
      : {}),
    ...(group === "current"
      ? { createdAt: { gte: start, lt: end } }
      : {}),
  };

  const stories = await prisma.story.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      conversationId: true,
      title: true,
      subject: true,
      status: true,
      resolutionSummary: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ stories });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ids?: string[]; month?: string; year?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let conversationIds: string[] = [];
  if (body.ids?.length) {
    const rows = await prisma.story.findMany({
      where: { workspaceId: ctx.workspace.id, id: { in: body.ids } },
      select: { conversationId: true },
    });
    conversationIds = rows.map((r) => r.conversationId);
  } else if (body.month) {
    const [y, m] = body.month.split("-").map(Number);
    if (!y || !m) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    const rows = await prisma.story.findMany({
      where: {
        workspaceId: ctx.workspace.id,
        createdAt: { gte: start, lt: end },
      },
      select: { conversationId: true },
    });
    conversationIds = rows.map((r) => r.conversationId);
  } else if (body.year) {
    const y = Number(body.year);
    if (!y) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y + 1, 0, 1));
    const rows = await prisma.story.findMany({
      where: {
        workspaceId: ctx.workspace.id,
        createdAt: { gte: start, lt: end },
      },
      select: { conversationId: true },
    });
    conversationIds = rows.map((r) => r.conversationId);
  }

  const deleted = await deleteConversations(ctx.workspace.id, conversationIds);
  return NextResponse.json({ ok: true, deleted });
}
