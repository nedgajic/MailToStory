import type { gmail_v1 } from "googleapis";

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

export function preprocessThread(
  thread: gmail_v1.Schema$Thread,
): PreprocessResult {
  const messages = thread.messages ?? [];
  const attachmentManifest: AttachmentInfo[] = [];
  const participantMap = new Map<string, string>();
  const cleanedMessages: string[] = [];

  let subject = "";
  let firstDate = "";
  let lastDate = "";

  messages.forEach((message, index) => {
    const headers = message.payload?.headers ?? [];
    const subjectHeader =
      headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
    const fromHeader =
      headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
    const dateHeader =
      headers.find((h) => h.name?.toLowerCase() === "date")?.value ?? "";

    if (index === 0) {
      subject = subjectHeader.replace(/^(Re:|Fwd:)\s*/gi, "").trim();
      firstDate = dateHeader;
    }
    lastDate = dateHeader || lastDate;

    const { name, email } = parseFromHeader(fromHeader);
    if (email) participantMap.set(email, name);

    const bodyText = extractBody(message.payload);
    const cleaned = stripQuotedReplies(bodyText);

    if (cleaned.trim().length > 10) {
      cleanedMessages.push(
        `[Message ${index + 1} | From: ${name || email} | Date: ${dateHeader}]\n${cleaned.trim()}`,
      );
    }

    const parts = message.payload?.parts ?? [];
    collectAttachments(
      parts,
      index,
      message.id ?? "",
      attachmentManifest,
    );
  });

  const metadata: ThreadMetadata = {
    subject,
    participants: Array.from(participantMap.entries()).map(([email, name]) => ({
      name,
      email,
    })),
    firstDate,
    lastDate,
    messageCount: messages.length,
  };

  return {
    cleanedThread: cleanedMessages.join("\n\n---\n\n"),
    attachmentManifest,
    metadata,
  };
}

export function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined,
): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, "base64").toString("utf-8");
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

/**
 * Prefer text/html from multipart messages (multipart/alternative).
 */
export function extractHtmlBody(
  payload: gmail_v1.Schema$MessagePart | undefined,
): string {
  if (!payload) return "";

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.body?.data && payload.mimeType?.includes("html")) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.parts) {
    const htmlPart = payload.parts.find(
      (p) => p.mimeType === "text/html" && p.body?.data,
    );
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
    }
    for (const part of payload.parts) {
      const nested = extractHtmlBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

const MIN_CUT_BEFORE_REPLY_HEADER = 28;

export function stripQuotedReplies(text: string): string {
  const lines = text.split("\n");
  const cleaned = lines.filter((line) => !line.trim().startsWith(">"));

  let joined = cleaned.join("\n");

  const headerPatterns: RegExp[] = [
    /\n-{2,9}\s*Original Message\s*-{2,9}\s*\r?\n/im,
    /-----Original Message-----/im,
    /\r?\n\r?\n\s*On\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b[\s\S]{3,900}?\bwrote\s*:\s*/im,
    /\r?\n\r?\n\s*On\s+\d{1,2}\s+[\s\S]{3,900}?\bwrote\s*:\s*/im,
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

function getPartHeader(
  part: gmail_v1.Schema$MessagePart,
  headerName: string,
): string | null {
  const raw = part.headers?.find(
    (h) => h.name?.toLowerCase() === headerName.toLowerCase(),
  )?.value;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Inline / CID images (signatures, HTML embeds) — not user-chosen attachments.
 * Keeps parts with explicit Content-Disposition: attachment (incl. images).
 */
export function isLikelySignatureOrInlineImage(
  part: gmail_v1.Schema$MessagePart,
): boolean {
  const mime = (part.mimeType ?? "").toLowerCase();
  if (!mime.startsWith("image/")) return false;

  const cdRaw = getPartHeader(part, "Content-Disposition") ?? "";
  const cdLower = cdRaw.toLowerCase();

  if (/^\s*attachment\b/i.test(cdRaw)) {
    return false;
  }

  if (cdLower.startsWith("inline")) {
    return true;
  }

  if (getPartHeader(part, "Content-ID")) {
    return true;
  }

  const fn = (part.filename ?? "").trim();
  if (
    /^image\d*\.(png|jpe?g|gif|webp|bmp)$/i.test(fn) ||
    /^outlook-[-\w]+\.(png|jpe?g|gif|webp)$/i.test(fn)
  ) {
    return true;
  }

  const size = part.body?.size;
  if (
    size != null &&
    size <= 6144 &&
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(fn)
  ) {
    return true;
  }

  return false;
}

export type ResolvedThreadAttachment = {
  attachmentId: string;
  mimeType: string;
  filename: string;
  /** Gmail-reported size before download; may be undefined for some payloads. */
  size?: number;
};

function normalizeAttachmentFilename(name: string): string {
  return name
    .trim()
    .normalize("NFC")
    .toLowerCase()
    .replace(/^.*[/\\]/, "");
}

/**
 * Find a real (non-inline-signature) attachment part on a message whose filename
 * matches, case-insensitively on the basename.
 */
export function resolveThreadAttachment(
  message: gmail_v1.Schema$Message,
  filename: string,
): ResolvedThreadAttachment | null {
  const want = normalizeAttachmentFilename(filename);
  if (!want) return null;
  const payload = message.payload;
  if (!payload) return null;

  const tryMatch = (
    part: gmail_v1.Schema$MessagePart,
  ): ResolvedThreadAttachment | null => {
    const fn = part.filename?.trim();
    if (
      !fn ||
      !part.body?.attachmentId ||
      isLikelySignatureOrInlineImage(part)
    ) {
      return null;
    }
    if (normalizeAttachmentFilename(fn) !== want) {
      return null;
    }
    return {
      attachmentId: part.body.attachmentId,
      mimeType: part.mimeType ?? "application/octet-stream",
      filename: fn,
      size: part.body.size ?? undefined,
    };
  };

  const rootHit = tryMatch(payload);
  if (rootHit) {
    return rootHit;
  }

  function walk(
    parts: gmail_v1.Schema$MessagePart[] | undefined,
  ): ResolvedThreadAttachment | null {
    for (const part of parts ?? []) {
      const hit = tryMatch(part);
      if (hit) return hit;
      const nested = walk(part.parts);
      if (nested) return nested;
    }
    return null;
  }

  return walk(payload.parts);
}

export function collectAttachments(
  parts: gmail_v1.Schema$MessagePart[],
  messageIndex: number,
  messageId: string,
  manifest: AttachmentInfo[],
): void {
  for (const part of parts) {
    if (
      part.filename &&
      part.filename.length > 0 &&
      part.body?.attachmentId &&
      messageId &&
      !isLikelySignatureOrInlineImage(part)
    ) {
      manifest.push({
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        messageIndex,
        attachmentId: part.body.attachmentId,
        messageId,
      });
    }
    if (part.parts) {
      collectAttachments(part.parts, messageIndex, messageId, manifest);
    }
  }
}

export function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<?([^>]+)>?$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  const bare = from.match(/<([^>]+)>/);
  if (bare) return { name: "", email: bare[1].trim() };
  if (from.includes("@")) return { name: "", email: from.trim() };
  return { name: "", email: "" };
}
