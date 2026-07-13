import type { gmail_v1 } from "googleapis";
import { extractBody, extractHtmlBody } from "@/lib/preprocessThread";
import { sanitizeEmailHtml } from "@/lib/sanitizeEmailHtml";

function header(
  headers:
    | { name?: string | null; value?: string | null }[]
    | undefined
    | null,
  name: string,
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

type GmailMessageLike = {
  id?: string | null;
  internalDate?: string | null;
  payload?: gmail_v1.Schema$MessagePart | null;
};

export type ThreadPreviewMessage = {
  messageId: string;
  from: string;
  date: string;
  body: string;
  bodyHtml: string | null;
};

/** Oldest first, matching how the thread is read in Gmail. */
export function sortThreadMessagesChronologically(
  messages: GmailMessageLike[],
): GmailMessageLike[] {
  return [...messages].sort(
    (a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0),
  );
}

export function messageToThreadPreview(
  message: GmailMessageLike,
): ThreadPreviewMessage | null {
  if (!message.id) return null;

  if (!message.payload) {
    return {
      messageId: message.id,
      from: "",
      date: "",
      body: "",
      bodyHtml: null,
    };
  }

  const headers = message.payload.headers ?? [];
  const rawHtml = extractHtmlBody(message.payload ?? undefined).trim();
  const bodyHtml = rawHtml.length > 0 ? sanitizeEmailHtml(rawHtml) : null;
  const bodyRaw = extractBody(message.payload ?? undefined);

  return {
    messageId: message.id,
    from: header(headers, "From"),
    date: header(headers, "Date"),
    body: bodyRaw,
    bodyHtml,
  };
}

export function subjectFromThreadMessages(
  messages: GmailMessageLike[],
): string {
  for (const message of messages) {
    const subject = header(message.payload?.headers ?? [], "Subject").trim();
    if (subject) return subject;
  }
  return "(no subject)";
}
