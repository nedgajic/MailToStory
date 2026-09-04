import prisma from "@/lib/prisma";

export async function touchLastSeen(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  } catch {
    // Non-critical; admin activity reporting should not block auth.
  }
}
