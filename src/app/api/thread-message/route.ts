import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { sanitizeEmailHtml } from "@/lib/sanitizeEmailHtml";
import {
  findThreadSourceMessage,
  legacyTurnSourcesFromMessages,
  parseSrcTurnIndex,
  parseThreadSourceMessages,
} from "@/lib/thread-source-messages";

function sourceToResponse(source: {
  id: string;
  from: string;
  date: string;
  subject: string;
  text: string;
}) {
  return NextResponse.json({
    id: source.id,
    subject: source.subject,
    from: source.from,
    date: source.date,
    html: null,
    body: source.text,
  });
}

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

  const story = await prisma.story.findFirst({
    where: {
      conversationId: threadId,
      workspaceId: ctx.workspace.id,
    },
    select: { sourceMessages: true, messageIdsInOrder: true },
  });

  const storedSources = parseThreadSourceMessages(story?.sourceMessages);
  const storedHit = findThreadSourceMessage(storedSources, messageId);
  if (storedHit) {
    return sourceToResponse(storedHit);
  }

  const turnIndex = parseSrcTurnIndex(messageId);
  if (turnIndex != null) {
    const messages = await prisma.conversationMessage.findMany({
      where: {
        conversationId: threadId,
        conversation: { workspaceId: ctx.workspace.id },
      },
      orderBy: { sequence: "asc" },
    });
    const legacySources = legacyTurnSourcesFromMessages(messages);
    const legacyHit = legacySources[turnIndex - 1];
    if (legacyHit) {
      return sourceToResponse(legacyHit);
    }
  }

  const messageIdsInOrder = Array.isArray(story?.messageIdsInOrder)
    ? story.messageIdsInOrder.filter((x): x is string => typeof x === "string")
    : [];
  const mappedIndex = messageIdsInOrder.indexOf(messageId);
  if (mappedIndex >= 0 && storedSources[mappedIndex]) {
    return sourceToResponse(storedSources[mappedIndex]);
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

  if (mappedIndex >= 0) {
    const allMessages = await prisma.conversationMessage.findMany({
      where: {
        conversationId: threadId,
        conversation: { workspaceId: ctx.workspace.id },
      },
      orderBy: { sequence: "asc" },
    });
    const legacySources = legacyTurnSourcesFromMessages(allMessages);
    const legacyHit = legacySources[mappedIndex];
    if (legacyHit) {
      return sourceToResponse(legacyHit);
    }
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
