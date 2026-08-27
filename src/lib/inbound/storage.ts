import { unlink } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma";

export function uploadRoot(): string {
  const configured = process.env.INBOUND_UPLOAD_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), "uploads");
}

export async function deleteConversationFiles(conversationId: string): Promise<void> {
  const rows = await prisma.conversationAttachment.findMany({
    where: { conversationId },
    select: { storagePath: true },
  });
  await Promise.all(
    rows.map(async (row) => {
      if (!row.storagePath) return;
      try {
        await unlink(row.storagePath);
      } catch {
        /* already gone */
      }
    }),
  );
}

export async function deleteConversations(
  workspaceId: string,
  conversationIds: string[],
): Promise<number> {
  const unique = [...new Set(conversationIds)];
  for (const id of unique) {
    const row = await prisma.conversation.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });
    if (!row) continue;
    await deleteConversationFiles(id);
    await prisma.conversation.delete({ where: { id } });
  }
  return unique.length;
}
