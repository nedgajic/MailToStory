import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { readAttachmentBuffer } from "@/lib/inbound/attachment-storage";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");
  const filename = url.searchParams.get("filename");
  if (!threadId || !filename) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: threadId, workspaceId: ctx.workspace.id },
    include: { attachments: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const want = filename.trim().toLowerCase();
  const att = conversation.attachments.find(
    (a) => a.filename.toLowerCase() === want,
  );
  if (!att?.storagePath) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
  const buf = await readAttachmentBuffer({
    storagePath: att.storagePath,
    storageBackend: att.storageBackend,
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${att.filename.replace(/"/g, "")}"`,
    },
  });
}
