import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "owner") {
    return NextResponse.json(
      { error: "Only the workspace owner can transfer ownership." },
      { status: 403 },
    );
  }

  let body: { memberId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const memberId = body.memberId?.trim();
  if (!memberId) {
    return NextResponse.json({ error: "Choose a team member." }, { status: 400 });
  }

  const target = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId: ctx.workspace.id,
      status: "active",
    },
  });
  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  if (target.userId === ctx.userId) {
    return NextResponse.json(
      { error: "You are already the owner." },
      { status: 400 },
    );
  }

  const ownerMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: ctx.workspace.id,
        userId: ctx.userId,
      },
    },
  });
  if (!ownerMembership || ownerMembership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.workspaceMember.update({
      where: { id: target.id },
      data: { role: "owner" },
    }),
    prisma.workspaceMember.update({
      where: { id: ownerMembership.id },
      data: { role: "admin" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
