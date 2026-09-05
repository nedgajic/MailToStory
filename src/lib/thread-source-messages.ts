import {
  messageBodyForParsing,
  parseForwardedThread,
  stripSubjectPrefix,
  type GenericMessage,
} from "@/lib/preprocessThread";

export type ThreadSourceMessage = {
  id: string;
  from: string;
  date: string;
  subject: string;
  text: string;
  /** Real DB message id for attachment downloads when the turn id is synthetic. */
  storageMessageId?: string;
};

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

function messageText(message: GenericMessage): string {
  return (message.text?.trim() || htmlToText(message.html ?? "")).trim();
}

export function buildSourceMessagesFromGenerics(
  generics: GenericMessage[],
  options?: { storageMessageIds?: Array<string | undefined> },
): ThreadSourceMessage[] {
  return generics.map((message, index) => ({
    id: `src-${index + 1}`,
    from: message.from,
    date: message.date,
    subject: stripSubjectPrefix(message.subject || ""),
    text: messageText(message),
    ...(options?.storageMessageIds?.[index]
      ? { storageMessageId: options.storageMessageIds[index] }
      : {}),
  }));
}

export function sourceMessageIdsInOrder(
  sources: ThreadSourceMessage[],
): string[] {
  return sources.map((source) => source.id);
}

export function parseThreadSourceMessages(json: unknown): ThreadSourceMessage[] {
  if (!Array.isArray(json)) return [];
  const out: ThreadSourceMessage[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const from = typeof row.from === "string" ? row.from : "";
    const date = typeof row.date === "string" ? row.date : "";
    const subject = typeof row.subject === "string" ? row.subject : "";
    const text = typeof row.text === "string" ? row.text : "";
    if (!id) continue;
    out.push({
      id,
      from,
      date,
      subject,
      text,
      ...(typeof row.storageMessageId === "string" && row.storageMessageId.trim()
        ? { storageMessageId: row.storageMessageId.trim() }
        : {}),
    });
  }
  return out;
}

export function findThreadSourceMessage(
  sources: ThreadSourceMessage[],
  messageId: string,
): ThreadSourceMessage | undefined {
  const want = messageId.trim();
  if (!want) return undefined;
  return sources.find((source) => source.id === want);
}

export function parseSrcTurnIndex(messageId: string): number | null {
  const match = messageId.trim().match(/^src-(\d+)$/);
  if (!match) return null;
  const index = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(index) && index >= 1 ? index : null;
}

type StoredConversationMessage = {
  id: string;
  subject: string;
  textBody: string;
  htmlBody: string | null;
  fromName: string | null;
  fromEmail: string;
  date: Date;
};

function messageLooksLikeForwardBlob(message: StoredConversationMessage): boolean {
  if (/Forwarded message/i.test(message.textBody)) return true;
  if (/Forwarded message/i.test(message.htmlBody ?? "")) return true;
  return false;
}

export function pickForwardParseSource(
  messages: StoredConversationMessage[],
): StoredConversationMessage | null {
  if (messages.length === 0) return null;
  const latest = messages[messages.length - 1]!;
  const subjectForward = /^(fwd|fw):/i.test(latest.subject ?? "");
  if (!subjectForward) return null;

  const withBlob = messages.filter(messageLooksLikeForwardBlob);
  if (withBlob.length > 0) {
    return withBlob[withBlob.length - 1]!;
  }
  if (messages.length === 1) return latest;
  return null;
}

export function legacyTurnSourcesFromMessages(
  messages: StoredConversationMessage[],
): ThreadSourceMessage[] {
  const forwardSource = pickForwardParseSource(messages);
  if (forwardSource) {
    const generics = parseForwardedThread(
      messageBodyForParsing(forwardSource),
      `${forwardSource.fromName} <${forwardSource.fromEmail}>`.trim(),
      forwardSource.date.toISOString(),
      forwardSource.subject,
    );
    return buildSourceMessagesFromGenerics(generics, {
      storageMessageIds: generics.map((_, index) =>
        index === 0 ? forwardSource.id : undefined,
      ),
    });
  }

  const generics: GenericMessage[] = messages.map((message) => ({
    id: "legacy",
    from: message.fromName
      ? `${message.fromName} <${message.fromEmail}>`
      : message.fromEmail,
    date: message.date.toISOString(),
    subject: message.subject,
    text: message.textBody,
    html: message.htmlBody,
  }));

  return buildSourceMessagesFromGenerics(generics, {
    storageMessageIds: messages.map((message) => message.id),
  });
}
