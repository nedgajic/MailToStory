import prisma from "@/lib/prisma";

/** Drop stale Google OAuth tokens so the next sign-in stores fresh ones. */
export async function clearGoogleAccountLink(userId: string): Promise<void> {
  await prisma.account.deleteMany({
    where: { userId, provider: "google" },
  });
}
