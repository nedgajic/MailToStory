import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { digestSchema, type Digest } from "@/lib/digest-schema";

export async function getCachedThreadDigest(
  userId: string,
  threadId: string,
): Promise<{ digest: Digest; messageIdsInOrder: string[] } | null> {
  const row = await prisma.threadDigest.findUnique({
    where: {
      userId_threadId: { userId, threadId },
    },
  });
  if (!row) return null;
  const parsed = digestSchema.safeParse(row.digest);
  if (!parsed.success) return null;
  const raw = row.messageIdsInOrder;
  if (!Array.isArray(raw) || !raw.every((x) => typeof x === "string")) {
    return null;
  }
  return { digest: parsed.data, messageIdsInOrder: raw };
}

export async function saveThreadDigest(
  userId: string,
  threadId: string,
  digest: Digest,
  messageIdsInOrder: string[],
): Promise<void> {
  const digestJson = JSON.parse(JSON.stringify(digest)) as Prisma.InputJsonValue;
  const idsJson = JSON.parse(
    JSON.stringify(messageIdsInOrder),
  ) as Prisma.InputJsonValue;
  await prisma.threadDigest.upsert({
    where: { userId_threadId: { userId, threadId } },
    create: {
      userId,
      threadId,
      digest: digestJson,
      messageIdsInOrder: idsJson,
    },
    update: {
      digest: digestJson,
      messageIdsInOrder: idsJson,
    },
  });
}
