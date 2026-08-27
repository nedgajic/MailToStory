import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/workspace";
import { canAddMember } from "@/lib/billing/entitlements";

export async function POST(
  _req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to accept this invite." }, { status: 401 });
  }
  const { token } = await context.params;
  const hashed = hashToken(token);
  const invite = await prisma.workspaceInvite.findUnique({ where: { token: hashed } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite is invalid or expired." }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: invite.workspaceId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace gone." }, { status: 400 });
  }
  if (!(await canAddMember(workspace.id, workspace.seatQuantity))) {
    return NextResponse.json(
      { error: "This workspace has no free seats." },
      { status: 400 },
    );
  }

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id },
    },
    create: {
      workspaceId: workspace.id,
      userId: session.user.id,
      role: invite.role,
      status: "active",
    },
    update: { role: invite.role, status: "active" },
  });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeWorkspaceId: workspace.id },
  });
  await prisma.workspaceInvite.delete({ where: { id: invite.id } });
  return NextResponse.json({ ok: true });
}
