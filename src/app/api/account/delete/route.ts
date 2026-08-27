import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { verifyPassword } from "@/lib/password";
import { deleteConversationFiles } from "@/lib/inbound/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { confirm?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const confirm = (body.confirm ?? "").trim().toLowerCase();
  const email = (ctx.email ?? "").toLowerCase();
  if (confirm !== email && confirm !== "delete") {
    return NextResponse.json(
      { error: "Type your email address or DELETE to confirm." },
      { status: 400 },
    );
  }

  if (ctx.hasPassword) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash || !(await verifyPassword(body.password ?? "", user.passwordHash))) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 400 });
    }
  }

  const owned = await prisma.workspaceMember.findMany({
    where: { userId: ctx.userId, role: "owner", status: "active" },
    include: {
      workspace: {
        include: { _count: { select: { members: true } } },
      },
    },
  });

  for (const row of owned) {
    if (row.workspace._count.members > 1) {
      return NextResponse.json(
        {
          error:
            "You still own a team workspace with other members. Unassign them or transfer ownership first.",
        },
        { status: 400 },
      );
    }
  }

  const ownedIds = owned.map((o) => o.workspaceId);
  for (const workspaceId of ownedIds) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (ws?.stripeSubscriptionId && stripeConfigured()) {
      try {
        await getStripe().subscriptions.cancel(ws.stripeSubscriptionId);
      } catch (error) {
        console.error("[account delete] stripe cancel", error);
      }
    }
    const conversations = await prisma.conversation.findMany({
      where: { workspaceId },
      select: { id: true },
    });
    for (const c of conversations) {
      await deleteConversationFiles(c.id);
    }
    await prisma.workspace.delete({ where: { id: workspaceId } });
  }

  await prisma.workspaceMember.deleteMany({ where: { userId: ctx.userId } });
  await prisma.user.delete({ where: { id: ctx.userId } });

  return NextResponse.json({ ok: true });
}
