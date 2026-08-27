import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { sanitizeEmailHtml } from "@/lib/sanitizeEmailHtml";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threadId = req.nextUrl.searchParams.get("threadId");
  const messageId = req.nextUrl.searchParams.get("messageId");
  if (!threadId || !messageId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const message = await prisma.conversationMessage.findFirst({
    where: {
      id: messageId,
      conversation: { id: threadId, workspaceId: ctx.workspace.id },
    },
  });
  if (!message) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: message.id,
    subject: message.subject,
    from: message.fromName
      ? `${message.fromName} <${message.fromEmail}>`
      : message.fromEmail,
    date: message.date.toISOString(),
    html: message.htmlBody ? sanitizeEmailHtml(message.htmlBody) : null,
    body: message.textBody,
  });
}
