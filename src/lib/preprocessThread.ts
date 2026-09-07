import { parseFromHeader } from "@/lib/parseFromHeader";

export type GenericMessage = {
  id: string;
  from: string;
  date: string;
  subject: string;
  text: string;
  html?: string | null;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    id: string;
  }>;
};

export type AttachmentInfo = {
  filename: string;
  mimeType: string;
  messageIndex: number;
  attachmentId: string;
  messageId: string;
};

export type ThreadMetadata = {
  subject: string;
  participants: { name: string; email: string }[];
  firstDate: string;
  lastDate: string;
  messageCount: number;
};

export type PreprocessResult = {
  cleanedThread: string;
  attachmentManifest: AttachmentInfo[];
  metadata: ThreadMetadata;
};

export function stripQuotedReplies(text: string): string {
  const MIN_CUT_BEFORE_REPLY_HEADER = 40;
  let joined = text.replace(/\r\n/g, "\n");

  const lines = joined.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) continue;
    kept.push(line);
  }
  joined = kept.join("\n");

  const headerPatterns = [
    /\r?\n\s*On\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b[\s\S]{3,900}?\bwrote\s*:\s*/im,
    /\r?\n\s*On\s+\d{1,2}\s+[\s\S]{3,900}?\bwrote\s*:\s*/im,
  ];

  let cutAt = joined.length;
  for (const re of headerPatterns) {
    const m = joined.match(re);
    if (
      m &&
      m.index !== undefined &&
      m.index >= MIN_CUT_BEFORE_REPLY_HEADER
    ) {
      cutAt = Math.min(cutAt, m.index);
    }
  }

  if (cutAt < joined.length) {
    joined = joined.slice(0, cutAt);
  }

  return joined
    .replace(/On [\s\S]{10,180}?wrote:\s*$/im, "")
    .replace(/_{3,}[\s\S]*$/m, "")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

export function stripSubjectPrefix(subject: string): string {
  return subject.replace(/^(re|fwd|fw):\s*/gi, "").trim();
}

/** Normalize line breaks and Gmail-broken angle brackets before forward parsing. */
export function normalizeForwardedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u202f/g, " ")
    .replace(/<\s*\n\s*/g, "<")
    .replace(/\n\s*>/g, ">")
    .trim();
}

const FORWARD_DELIMITER_ONLY =
  /^-{3,}\s*(?:Forwarded message|Original Message)\s*-{3,}$/i;

const FORWARD_SPLIT_RE =
  /\n(?=-{5,}\s*Forwarded message\s*-{5,}|----+ ?Original Message ?----|From:\s+\S|On\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d{1,2})\b[\s\S]{0,280}?\bwrote\s*:)/i;

function isForwardDelimiterOnly(part: string): boolean {
  return FORWARD_DELIMITER_ONLY.test(part.trim());
}

function extractWroteHeader(part: string): {
  date: string;
  from: string;
} | null {
  const match = part.match(
    /^On\s+(.+?),\s+(.+?)\s+(?:<([^>]+@[^>]+)>|([^<\n]+@[^\s>]+))\s*wrote:\s*/im,
  );
  if (!match) return null;
  const date = `${match[1]?.trim() ?? ""}, ${match[2]?.trim() ?? ""}`.trim();
  const from = (match[3] ?? match[4] ?? "").trim();
  if (!from) return null;
  return { date, from };
}

/**
 * Split a single forwarded blob into message-like chunks.
 * Prefer this over stripQuotedReplies for inbound forwards.
 */
export function parseForwardedThread(
  text: string,
  fallbackFrom: string,
  fallbackDate: string,
  fallbackSubject: string,
): GenericMessage[] {
  const normalized = normalizeForwardedText(text);
  if (!normalized) {
    return [
      {
        id: "m1",
        from: fallbackFrom,
        date: fallbackDate,
        subject: fallbackSubject,
        text: "",
      },
    ];
  }

  const parts = normalized
    .split(FORWARD_SPLIT_RE)
    .map((p) => p.trim())
    .filter((p) => p && !isForwardDelimiterOnly(p));

  if (parts.length <= 1) {
    return [
      {
        id: "m1",
        from: fallbackFrom,
        date: fallbackDate,
        subject: fallbackSubject,
        text: normalized,
      },
    ];
  }

  const parsed = parts.map((part, index) => {
    const fromMatch = part.match(/^From:\s*(.+)$/im);
    const dateMatch = part.match(/^Date:\s*(.+)$/im);
    const subjectMatch = part.match(/^Subject:\s*(.+)$/im);
    const wroteHeader = extractWroteHeader(part);
    let body = part;
    if (fromMatch) {
      body = part.replace(/^[\s\S]*?\n\n/, "\n").trim();
    } else if (wroteHeader) {
      body = part.replace(/^On[\s\S]*?wrote:\s*/im, "").trim();
    }
    const from =
      fromMatch?.[1]?.trim() ||
      wroteHeader?.from ||
      fallbackFrom;
    const date =
      dateMatch?.[1]?.trim() || wroteHeader?.date || fallbackDate;
    return {
      id: `m${index + 1}`,
      from,
      date,
      subject: subjectMatch?.[1]?.trim() || fallbackSubject,
      text: body || part,
    };
  });

  return parsed.reverse();
}

/** Prefer plain text; fall back to stripped HTML when the body is empty or tiny. */
export function messageBodyForParsing(input: {
  textBody: string;
  htmlBody?: string | null;
}): string {
  const text = input.textBody?.trim() ?? "";
  if (text.length > 80) return text;
  const fromHtml = htmlToText(input.htmlBody ?? "");
  return fromHtml || text;
}

export function preprocessMessages(messages: GenericMessage[]): PreprocessResult {
  const attachmentManifest: AttachmentInfo[] = [];
  const participantMap = new Map<string, string>();
  const cleanedMessages: string[] = [];

  let subject = "";
  let firstDate = "";
  let lastDate = "";

  messages.forEach((message, index) => {
    if (index === 0) {
      subject = stripSubjectPrefix(message.subject || "");
      firstDate = message.date;
    }
    lastDate = message.date || lastDate;

    const { name, email } = parseFromHeader(message.from);
    if (email) participantMap.set(email, name || email);

    const body = message.text?.trim() || htmlToText(message.html ?? "");
    if (body.trim().length > 2) {
      cleanedMessages.push(
        `[Message ${index + 1} | From: ${name || email || message.from} | Date: ${message.date}]\n${body.trim()}`,
      );
    }

    for (const att of message.attachments ?? []) {
      attachmentManifest.push({
        filename: att.filename,
        mimeType: att.mimeType,
        messageIndex: index,
        attachmentId: att.id,
        messageId: message.id,
      });
    }
  });

  return {
    cleanedThread: cleanedMessages.join("\n\n---\n\n"),
    attachmentManifest,
    metadata: {
      subject: subject || "(no subject)",
      participants: Array.from(participantMap.entries()).map(([email, name]) => ({
        name,
        email,
      })),
      firstDate,
      lastDate,
      messageCount: messages.length,
    },
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
