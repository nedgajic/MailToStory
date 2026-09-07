import prisma from "@/lib/prisma";
import { deleteAttachmentFile } from "@/lib/inbound/attachment-storage";

export { uploadRoot, attachmentStorageMode, isR2Configured } from "@/lib/inbound/attachment-storage";

export async function deleteConversationFiles(conversationId: string): Promise<void> {
  const rows = await prisma.conversationAttachment.findMany({
    where: { conversationId },
    select: { storagePath: true, storageBackend: true },
  });
  await Promise.all(
    rows.map((row) =>
      deleteAttachmentFile({
        storagePath: row.storagePath,
        storageBackend: row.storageBackend,
      }),
    ),
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
