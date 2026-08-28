import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import {
  requestForwardingAddressVerification,
  resendForwardingAddressVerification,
} from "@/lib/email/forwarding-address";
import {
  isMemberAccountEmail,
  verifiedMemberEmails,
} from "@/lib/inbound/sender-allowlist";
import { normalizeEmail } from "@/lib/password";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [memberEmails, forwardingRows] = await Promise.all([
    verifiedMemberEmails(ctx.workspace.id),
    prisma.forwardingAddress.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, verifiedAt: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    memberEmails,
    forwardingAddresses: forwardingRows.map((row) => ({
      id: row.id,
      email: row.email,
      verified: Boolean(row.verifiedAt),
      createdAt: row.createdAt.toISOString(),
    })),
    canManage: isWorkspaceAdmin(ctx.role),
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
    return NextResponse.json({ error: "Only workspace admins can manage forwarding addresses." }, { status: 403 });
  }

  let body: { email?: string; action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "resend") {
    const email =
      body.email?.trim() ||
      (body.id
        ? (
            await prisma.forwardingAddress.findFirst({
              where: { id: body.id, workspaceId: ctx.workspace.id },
              select: { email: true },
            })
          )?.email
        : undefined);
    if (!email) {
      return NextResponse.json({ error: "Email or id is required." }, { status: 400 });
    }
    try {
      await resendForwardingAddressVerification({
        workspaceId: ctx.workspace.id,
        email,
        workspaceName: ctx.workspace.name,
      });
      return NextResponse.json({
        ok: true,
        message: `Confirmation link resent to ${normalizeEmail(email)}.`,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "NOT_FOUND") {
        return NextResponse.json({ error: "Address not found." }, { status: 404 });
      }
      if (code === "ALREADY_VERIFIED") {
        return NextResponse.json({ error: "Address is already verified." }, { status: 409 });
      }
      console.error("[forwarding-addresses] resend", error);
      return NextResponse.json({ error: "Could not resend confirmation." }, { status: 500 });
    }
  }

  const email = body.email?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const result = await requestForwardingAddressVerification({
      workspaceId: ctx.workspace.id,
      email,
      addedById: session.user.id,
      workspaceName: ctx.workspace.name,
    });
    return NextResponse.json({
      ok: true,
      email: result.email,
      pending: result.pending,
      message: result.pending
        ? `Confirmation link sent to ${result.email}.`
        : `${result.email} is already verified.`,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "INVALID_EMAIL") {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (code === "ALREADY_MEMBER_EMAIL") {
      return NextResponse.json({
        error: "That address is already a verified workspace member account.",
      }, { status: 409 });
    }
    console.error("[forwarding-addresses] POST", error);
    return NextResponse.json({ error: "Could not add forwarding address." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Only workspace admins can manage forwarding addresses." }, { status: 403 });
  }

  let body: { id?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email ? normalizeEmail(body.email) : null;
  if (!body.id && !email) {
    return NextResponse.json({ error: "id or email is required." }, { status: 400 });
  }

  if (email && (await isMemberAccountEmail(ctx.workspace.id, email))) {
    return NextResponse.json({
      error: "Member account emails cannot be removed here.",
    }, { status: 400 });
  }

  const row = body.id
    ? await prisma.forwardingAddress.findFirst({
        where: { id: body.id, workspaceId: ctx.workspace.id },
      })
    : await prisma.forwardingAddress.findFirst({
        where: { workspaceId: ctx.workspace.id, email: email! },
      });

  if (!row) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.forwardingAddress.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}
