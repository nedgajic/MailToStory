import { authOptions } from "@/auth";
import { fetchGmailAttachment, getThreadFull } from "@/lib/gmail";
import { resolveThreadAttachment } from "@/lib/preprocessThread";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const MAX_BYTES = 24 * 1024 * 1024;

function assertSafeQueryFilename(name: string | null): string | null {
  if (!name?.trim()) return null;
  const t = name.trim();
  if (t.length > 512) return null;
  if (t.includes("/") || t.includes("\\") || t.includes("..")) {
    return null;
  }
  return t;
}

/**
 * `Content-Disposition` must be a ByteString (Latin-1). Use ASCII `filename` plus
 * RFC 5987 / RFC 8187 `filename*=UTF-8''…` for the real Unicode name.
 */
function contentDispositionInline(filename: string): string {
  const ascii =
    filename
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/\\/g, "_")
      .replace(/"/g, "_")
      .replace(/[/]+/g, "_") || "attachment";
  const starValue = encodeURIComponent(filename).replace(
    /[!'*()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
  );
  return `inline; filename="${ascii}"; filename*=UTF-8''${starValue}`;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId")?.trim() ?? "";
  const messageId = searchParams.get("messageId")?.trim() ?? "";
  const filename = assertSafeQueryFilename(searchParams.get("filename"));

  if (!threadId || !messageId || !filename) {
    return NextResponse.json(
      { error: "threadId, messageId, and filename are required" },
      { status: 400 },
    );
  }

  try {
    const thread = await getThreadFull(session.user.id, threadId);
    const inThread = (thread.messages ?? []).some((m) => m.id === messageId);
    if (!inThread) {
      return NextResponse.json({ error: "Message not in thread" }, { status: 404 });
    }

    const message = (thread.messages ?? []).find((m) => m.id === messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const resolved = resolveThreadAttachment(message, filename);
    if (!resolved) {
      return NextResponse.json(
        { error: "Attachment not found on message" },
        { status: 404 },
      );
    }

    if (resolved.size != null && resolved.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Attachment too large to load in the browser" },
        { status: 413 },
      );
    }

    const buf = await fetchGmailAttachment(
      session.user.id,
      messageId,
      resolved.attachmentId,
    );
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "Attachment too large to load in the browser" },
        { status: 413 },
      );
    }

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": resolved.mimeType,
        "Content-Disposition": contentDispositionInline(resolved.filename),
        "Cache-Control": "private, max-age=120",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load attachment";
    console.error("attachment route error:", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
