import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

const POSTMARK_API = "https://api.postmarkapp.com/email";

export function postmarkConfigured(): boolean {
  return Boolean(process.env.POSTMARK_SERVER_TOKEN?.trim());
}

function fromAddress(): string {
  return (
    process.env.POSTMARK_FROM_EMAIL?.trim() ||
    `${BRAND_NAME} <noreply@mailtostory.com>`
  );
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN?.trim();
  if (!token) {
    console.warn("[email] POSTMARK_SERVER_TOKEN missing; skipped send:", input.subject);
    return;
  }

  const res = await fetch(POSTMARK_API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: fromAddress(),
      To: input.to,
      Subject: input.subject,
      TextBody: input.text,
      HtmlBody: input.html ?? `<pre>${escapeHtml(input.text)}</pre>`,
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Postmark send failed ${res.status}: ${body}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendVerifyEmail(to: string, url: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: `Verify your ${BRAND_NAME} email`,
    text: `Confirm your email to activate forwarding.\n\n${url}\n\nIf you did not create a ${BRAND_NAME} account, ignore this message.`,
  });
}

export async function sendResetEmail(to: string, url: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: `Reset your ${BRAND_NAME} password`,
    text: `Reset your password:\n\n${url}\n\nThis link expires in 1 hour. If you did not request it, ignore this message.`,
  });
}

export async function sendInviteEmail(to: string, url: string, workspaceName: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: `Join ${workspaceName} on ${BRAND_NAME}`,
    text: `You were invited to ${workspaceName} on ${BRAND_NAME}.\n\nAccept the invite:\n${url}\n`,
  });
}

export function appUrl(path: string): string {
  const base = (process.env.NEXTAUTH_URL?.trim() || BRAND_URL).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
