import { authOptions } from "@/auth";
import { getThreadFull } from "@/lib/gmail";
import { GoogleReconnectRequiredError } from "@/lib/google-auth-errors";
import {
  messageToThreadPreview,
  sortThreadMessagesChronologically,
  subjectFromThreadMessages,
} from "@/lib/threadMessagePreview";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threadId = new URL(req.url).searchParams.get("threadId")?.trim();
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }

  try {
    const thread = await getThreadFull(session.user.id, threadId);
    const rawMessages = sortThreadMessagesChronologically(thread.messages ?? []);
    if (rawMessages.length === 0) {
      return NextResponse.json({ error: "Thread has no messages" }, { status: 404 });
    }

    const messages = rawMessages
      .map((message) => messageToThreadPreview(message))
      .filter((message): message is NonNullable<typeof message> => message !== null);

    if (messages.length === 0) {
      return NextResponse.json({ error: "Thread has no messages" }, { status: 404 });
    }

    return NextResponse.json({
      threadId,
      subject: subjectFromThreadMessages(rawMessages),
      messageCount: rawMessages.length,
      messages,
    });
  } catch (e) {
    if (e instanceof GoogleReconnectRequiredError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : "Failed to load preview";
    console.error("thread-preview error:", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
