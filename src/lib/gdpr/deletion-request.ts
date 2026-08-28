import prisma from "@/lib/prisma";
import { normalizeEmail } from "@/lib/password";
import { appUrl, sendTransactionalEmail } from "@/lib/email/send";
import { deleteDataByEmail } from "@/lib/gdpr/export-data";
import { hashToken, newRawToken } from "@/lib/workspace";
import { BRAND_NAME } from "@/lib/brand";

const REQUEST_TTL_MS = 24 * 60 * 60 * 1000;

export async function createDeletionRequest(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const rawToken = newRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REQUEST_TTL_MS);

  await prisma.gdprRequest.create({
    data: {
      email: normalized,
      type: "delete",
      tokenHash,
      status: "pending",
      expiresAt,
    },
  });

  const confirmUrl = appUrl(
    `/data-request/confirm?token=${encodeURIComponent(rawToken)}&type=delete`,
  );
  await sendTransactionalEmail({
    to: normalized,
    subject: `Confirm your ${BRAND_NAME} data deletion request`,
    text: [
      `We received a request to delete data associated with ${normalized} on ${BRAND_NAME}.`,
      "",
      "If you made this request, confirm it here:",
      confirmUrl,
      "",
      "This link expires in 24 hours. If you did not request deletion, ignore this message.",
      "",
      `If this email belongs to an active account, sign in and delete your account under Settings → Profile instead.`,
    ].join("\n"),
  });
}

export type GdprConfirmResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function confirmGdprRequest(input: {
  rawToken: string;
  type: "delete";
}): Promise<GdprConfirmResult> {
  const tokenHash = hashToken(input.rawToken.trim());
  const request = await prisma.gdprRequest.findUnique({
    where: { tokenHash },
  });

  if (!request || request.type !== input.type) {
    return { ok: false, error: "This confirmation link is invalid or expired." };
  }
  if (request.status !== "pending") {
    return {
      ok: false,
      error: "This request has already been processed.",
    };
  }
  if (request.expiresAt.getTime() < Date.now()) {
    await prisma.gdprRequest.update({
      where: { id: request.id },
      data: { status: "expired" },
    });
    return { ok: false, error: "This confirmation link has expired." };
  }

  const removed = await deleteDataByEmail(request.email);
  await prisma.gdprRequest.update({
    where: { id: request.id },
    data: {
      status: "completed",
      confirmedAt: new Date(),
      completedAt: new Date(),
    },
  });

  console.info("[gdpr] deletion confirmed", {
    email: request.email,
    removed,
  });

  return {
    ok: true,
    message:
      removed > 0
        ? "Matching records have been deleted."
        : "No matching records were found for this email.",
  };
}
