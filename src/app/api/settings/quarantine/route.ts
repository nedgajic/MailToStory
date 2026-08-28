import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/session";
import {
  listActiveQuarantine,
  rejectQuarantinedInbound,
  rejectQuarantineForSender,
} from "@/lib/inbound/quarantine";
import { requestForwardingAddressVerification } from "@/lib/email/forwarding-address";
import { scheduleReleaseQuarantineForSender } from "@/lib/inbound/ingest";
import { isMemberAccountEmail } from "@/lib/inbound/sender-allowlist";
import {
  canActOnQuarantineSender,
  quarantineSenderFilter,
} from "@/lib/inbound/quarantine-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filter = quarantineSenderFilter(ctx);
  if (filter.fromEmail === "__none__") {
    return NextResponse.json({ items: [] });
  }

  const items = await listActiveQuarantine(ctx.workspace.id, filter);
  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      fromEmail: item.fromEmail,
      fromName: item.fromName,
      subject: item.subject,
      snippet: item.snippet,
      attachmentCount: item.attachmentCount,
      expiresAt: item.expiresAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
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

  let body: {
    action?: "approve" | "reject";
    id?: string;
    fromEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = body.fromEmail?.trim();
  if (fromEmail && !canActOnQuarantineSender(ctx, fromEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.action === "reject") {
    if (body.id) {
      const row = await prisma.quarantinedInbound.findFirst({
        where: { id: body.id, workspaceId: ctx.workspace.id },
        select: { id: true, fromEmail: true },
      });
      if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (!canActOnQuarantineSender(ctx, row.fromEmail)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await rejectQuarantinedInbound(ctx.workspace.id, row.id);
      return NextResponse.json({ ok: true });
    }
    if (fromEmail) {
      if (!canActOnQuarantineSender(ctx, fromEmail)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const count = await rejectQuarantineForSender(
        ctx.workspace.id,
        fromEmail,
      );
      return NextResponse.json({ ok: true, rejected: count });
    }
    return NextResponse.json({ error: "id or fromEmail required." }, { status: 400 });
  }

  if (body.action === "approve") {
    if (!fromEmail) {
      return NextResponse.json({ error: "fromEmail is required." }, { status: 400 });
    }
    if (!canActOnQuarantineSender(ctx, fromEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      if (await isMemberAccountEmail(ctx.workspace.id, fromEmail)) {
        const queued = await scheduleReleaseQuarantineForSender({
          workspaceId: ctx.workspace.id,
          fromEmail,
        });
        return NextResponse.json({
          ok: true,
          message:
            queued > 0
              ? `Processing ${queued} held message${queued === 1 ? "" : "s"} in the background.`
              : "Member account email is already allowed.",
          queued,
        });
      }

      const result = await requestForwardingAddressVerification({
        workspaceId: ctx.workspace.id,
        email: fromEmail,
        addedById: session.user.id,
        workspaceName: ctx.workspace.name,
      });

      let queued = 0;
      if (!result.pending) {
        queued = await scheduleReleaseQuarantineForSender({
          workspaceId: ctx.workspace.id,
          fromEmail: result.email,
        });
      }

      return NextResponse.json({
        ok: true,
        message: result.pending
          ? `Confirmation link sent to ${result.email}. Held mail will process after verification.`
          : queued > 0
            ? `${result.email} is verified. Processing ${queued} held message${queued === 1 ? "" : "s"} in the background.`
            : `${result.email} is verified.`,
        pending: result.pending,
        queued,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "INVALID_EMAIL") {
        return NextResponse.json({ error: "Invalid email." }, { status: 400 });
      }
      if (code === "ALREADY_MEMBER_EMAIL") {
        return NextResponse.json({
          error: "That address is already a verified member account.",
        }, { status: 409 });
      }
      console.error("[quarantine] approve", error);
      return NextResponse.json({ error: "Could not approve sender." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
