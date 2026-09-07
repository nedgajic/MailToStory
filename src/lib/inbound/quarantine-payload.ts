import type { PostmarkInboundPayload } from "@/lib/inbound/postmark";

const MAX_HTML_CHARS = 50_000;

export function truncateQuarantineHtml(html: string | null | undefined): string | null {
  if (!html?.trim()) return null;
  if (html.length <= MAX_HTML_CHARS) return html;
  return html.slice(0, MAX_HTML_CHARS);
}

export type QuarantineMailFields = {
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  textBody: string;
  htmlBody: string | null;
  toAddresses: string;
  messageDate: Date | null;
  attachmentCount: number;
  postmarkMessageId: string | null;
};

export function quarantineFieldsFromPayload(
  payload: PostmarkInboundPayload,
  input: {
    fromEmail: string;
    fromName: string;
    subject: string;
    snippet: string;
    messageDate: Date;
  },
): QuarantineMailFields {
  const attachments = payload.Attachments ?? [];
  return {
    fromEmail: input.fromEmail,
    fromName: input.fromName,
    subject: input.subject,
    snippet: input.snippet,
    textBody: payload.TextBody?.trim() || input.snippet,
    htmlBody: truncateQuarantineHtml(payload.HtmlBody),
    toAddresses: payload.To ?? "",
    messageDate: input.messageDate,
    attachmentCount: attachments.length,
    postmarkMessageId: payload.MessageID?.trim() || null,
  };
}

export function quarantineRowToPayload(row: {
  fromEmail: string;
  fromName: string;
  subject: string;
  textBody: string;
  htmlBody: string | null;
  toAddresses: string;
  messageDate: Date | null;
  postmarkMessageId: string | null;
}): PostmarkInboundPayload {
  return {
    From: row.fromName
      ? `${row.fromName} <${row.fromEmail}>`
      : row.fromEmail,
    FromFull: {
      Email: row.fromEmail,
      Name: row.fromName || undefined,
    },
    To: row.toAddresses,
    Subject: row.subject,
    TextBody: row.textBody,
    HtmlBody: row.htmlBody ?? undefined,
    Date: row.messageDate?.toISOString(),
    MessageID: row.postmarkMessageId ?? undefined,
    Attachments: [],
  };
}
