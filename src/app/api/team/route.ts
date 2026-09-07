import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import prisma from "@/lib/prisma";
import { canAddMember } from "@/lib/billing/entitlements";
import { isValidEmail, normalizeEmail } from "@/lib/password";
import { hashToken, newRawToken } from "@/lib/workspace";
import { appUrl, sendInviteEmail } from "@/lib/email/send";
import type { MemberRole } from "@/lib/billing/plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: ctx.workspace.id, status: "active" },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId: ctx.workspace.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    seatQuantity: ctx.workspace.seatQuantity,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string; role?: MemberRole };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = normalizeEmail(body.email ?? "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  const role: MemberRole = body.role === "admin" ? "admin" : "member";
  if (!(await canAddMember(ctx.workspace.id, ctx.workspace.seatQuantity))) {
    return NextResponse.json(
      { error: "All seats are used. Add a seat first." },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: ctx.workspace.id,
          userId: existingUser.id,
        },
      },
    });
    if (already?.status === "active") {
      return NextResponse.json({ error: "That person is already on the team." }, { status: 409 });
    }
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: ctx.workspace.id,
          userId: existingUser.id,
        },
      },
      create: {
        workspaceId: ctx.workspace.id,
        userId: existingUser.id,
        role,
        status: "active",
      },
      update: { role, status: "active" },
    });
    return NextResponse.json({ ok: true, joined: true });
  }

  const raw = newRawToken();
  await prisma.workspaceInvite.create({
    data: {
      workspaceId: ctx.workspace.id,
      email,
      role,
      token: hashToken(raw),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  await sendInviteEmail(
    email,
    appUrl(`/invite/${raw}`),
    ctx.workspace.name,
  );
  return NextResponse.json({ ok: true, invited: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { memberId?: string; inviteId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.inviteId) {
    await prisma.workspaceInvite.deleteMany({
      where: { id: body.inviteId, workspaceId: ctx.workspace.id },
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }
  const member = await prisma.workspaceMember.findFirst({
    where: { id: body.memberId, workspaceId: ctx.workspace.id },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (member.role === "owner") {
    return NextResponse.json({ error: "The owner cannot be unassigned." }, { status: 400 });
  }
  await prisma.workspaceMember.delete({ where: { id: member.id } });
  if (member.userId) {
    await prisma.user.updateMany({
      where: { id: member.userId, activeWorkspaceId: ctx.workspace.id },
      data: { activeWorkspaceId: null },
    });
  }
  return NextResponse.json({ ok: true });
}
