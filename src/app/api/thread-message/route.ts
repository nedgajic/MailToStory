import { authOptions } from "@/auth";
import { getThreadFull } from "@/lib/gmail";
import {
  extractBody,
  extractHtmlBody,
  stripQuotedReplies,
} from "@/lib/preprocessThread";
import { sanitizeEmailHtml, takeInitialEmailHtml } from "@/lib/sanitizeEmailHtml";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

function header(
  headers:
    | { name?: string | null; value?: string | null }[]
    | undefined
    | null,
  name: string,
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  const messageId = searchParams.get("messageId");

  if (!threadId?.trim() || !messageId?.trim()) {
    return NextResponse.json(
      { error: "threadId and messageId are required" },
      { status: 400 },
    );
  }

  try {
    const thread = await getThreadFull(session.user.id, threadId);
    const message = (thread.messages ?? []).find((m) => m.id === messageId);

    if (!message?.payload) {
      return NextResponse.json(
        { error: "Message not found in thread" },
        { status: 404 },
      );
    }

    const headers = message.payload.headers ?? [];

    const rawHtml = extractHtmlBody(message.payload);
    const initialHtml = rawHtml ? takeInitialEmailHtml(rawHtml) : "";
    const bodyHtml =
      initialHtml.trim().length > 0 ? sanitizeEmailHtml(initialHtml) : null;

    const bodyRaw = extractBody(message.payload);

    return NextResponse.json({
      from: header(headers, "From"),
      date: header(headers, "Date"),
      subject: header(headers, "Subject"),
      body: stripQuotedReplies(bodyRaw),
      bodyHtml,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load message";
    console.error("thread-message error:", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
