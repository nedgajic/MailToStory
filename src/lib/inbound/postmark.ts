import { inboundDomain } from "@/lib/workspace";

export type PostmarkInboundPayload = {
  From?: string;
  FromName?: string;
  FromFull?: { Email?: string; Name?: string };
  To?: string;
  Cc?: string;
  Bcc?: string;
  OriginalRecipient?: string;
  Subject?: string;
  TextBody?: string;
  HtmlBody?: string;
  Date?: string;
  MessageID?: string;
  MailboxHash?: string;
  Headers?: Array<{ Name?: string; Value?: string }>;
  Attachments?: Array<{
    Name?: string;
    Content?: string;
    ContentType?: string;
    ContentLength?: number;
    ContentID?: string | null;
  }>;
};

export function headerValue(
  payload: PostmarkInboundPayload,
  name: string,
): string {
  const found = payload.Headers?.find(
    (h) => h.Name?.toLowerCase() === name.toLowerCase(),
  );
  return found?.Value?.trim() ?? "";
}

export function extractLocalParts(
  payload: PostmarkInboundPayload,
  domain = inboundDomain(),
): string[] {
  const haystack = [
    payload.OriginalRecipient,
    payload.To,
    payload.Cc,
    payload.Bcc,
    payload.MailboxHash ? `${payload.MailboxHash}@${domain}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const matches = haystack.matchAll(
    /([a-z0-9._+-]+)@([a-z0-9.-]+)/gi,
  );
  const parts: string[] = [];
  const want = domain.toLowerCase();
  for (const m of matches) {
    const local = m[1]?.toLowerCase();
    const host = m[2]?.toLowerCase();
    if (local && host === want && !parts.includes(local)) {
      parts.push(local);
    }
  }
  return parts;
}

export function senderFromPayload(payload: PostmarkInboundPayload): string {
  if (payload.FromFull?.Email) {
    const name = payload.FromFull.Name?.trim();
    return name
      ? `${name} <${payload.FromFull.Email}>`
      : payload.FromFull.Email;
  }
  return payload.From?.trim() || "";
}
