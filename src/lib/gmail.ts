import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/google-token";
import { formatThreadCorrespondents } from "@/lib/parseFromHeader";
import {
  decodeThreadListCursor,
  encodeThreadListCursor,
} from "@/lib/thread-list-cursor";
import { THREAD_LIST_PAGE_SIZE } from "@/lib/thread-list-constants";

function gmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

const THREAD_META_FIELDS =
  "id,snippet,messages(id,labelIds,payload(headers))";

/** Gmail list chunk size when filling a filtered (multi-message) page. */
const GMAIL_LIST_CHUNK = 50;
const MAX_FILTERED_LIST_ROUNDS = 12;

export type ThreadListItem = {
  id: string;
  subject: string;
  snippet: string;
  /** Raw `Date` header from the latest message (for inbox-style formatting). */
  date: string;
  /** Gmail messages in this thread (1 = standalone email, still digestible). */
  messageCount: number;
  /** Display names of other thread participants (never the mailbox owner). */
  from: string;
  /** True if any message in the thread still has the UNREAD label. */
  unread: boolean;
};

export type ListThreadsResult = {
  threads: ThreadListItem[];
  /** Opaque cursor for the next page (Gmail token or encoded filter cursor). */
  nextPageToken?: string;
};

function headerValue(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string,
): string {
  const found = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value ?? "";
}

function threadRefToItem(
  id: string,
  data: {
    snippet?: string | null;
    messages?: {
      id?: string | null;
      labelIds?: string[] | null;
      payload?: { headers?: { name?: string | null; value?: string | null }[] | null } | null;
    }[] | null;
  },
  ownerEmail?: string,
): ThreadListItem {
  const messages = data.messages ?? [];
  const last = messages[messages.length - 1];
  const headers = last?.payload?.headers ?? [];

  return {
    id,
    subject: headerValue(headers, "Subject") || "(no subject)",
    snippet: data.snippet ?? "",
    date: headerValue(headers, "Date"),
    messageCount: messages.length,
    from: formatThreadCorrespondents(messages, ownerEmail),
    unread: messages.some((m) => Boolean(m.labelIds?.includes("UNREAD"))),
  };
}

async function fetchThreadMetadata(
  gmail: ReturnType<typeof gmailClient>,
  threadId: string,
  ownerEmail?: string,
): Promise<ThreadListItem> {
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["Subject", "Date", "From", "To", "Cc"],
    fields: THREAD_META_FIELDS,
  });
  return threadRefToItem(threadId, thread.data, ownerEmail);
}

async function listThreadsSimple(
  gmail: ReturnType<typeof gmailClient>,
  pageSize: number,
  pageToken?: string,
  ownerEmail?: string,
): Promise<ListThreadsResult> {
  const listed = await gmail.users.threads.list({
    userId: "me",
    maxResults: pageSize,
    pageToken,
    q: "in:inbox",
  });

  const refs = (listed.data.threads ?? []).filter((r) => r.id);
  const items = await Promise.all(
    refs.map((ref) => fetchThreadMetadata(gmail, ref.id!, ownerEmail)),
  );

  return {
    threads: items,
    nextPageToken: listed.data.nextPageToken ?? undefined,
  };
}

async function listThreadsMinMessages(
  gmail: ReturnType<typeof gmailClient>,
  pageSize: number,
  minMessages: number,
  pageToken?: string | null,
  ownerEmail?: string,
): Promise<ListThreadsResult> {
  const cursor = decodeThreadListCursor(pageToken);
  let gmailToken = cursor.gmailPageToken;
  let pendingSkip = cursor.skip ?? 0;
  const collected: ThreadListItem[] = [];

  for (let round = 0; round < MAX_FILTERED_LIST_ROUNDS; round += 1) {
    const listed = await gmail.users.threads.list({
      userId: "me",
      maxResults: GMAIL_LIST_CHUNK,
      pageToken: gmailToken,
      q: "in:inbox",
    });

    const listTokenUsed = gmailToken;
    const refs = (listed.data.threads ?? []).filter((r) => r.id);
    if (refs.length === 0) {
      break;
    }

    const items = await Promise.all(
      refs.map((ref) => fetchThreadMetadata(gmail, ref.id!, ownerEmail)),
    );
    const matching = items.filter((t) => t.messageCount >= minMessages);
    const skipAtBatchStart = pendingSkip;
    const slice =
      skipAtBatchStart > 0 ? matching.slice(skipAtBatchStart) : matching;
    pendingSkip = 0;

    let consumed = 0;
    while (consumed < slice.length && collected.length < pageSize) {
      collected.push(slice[consumed]!);
      consumed += 1;
    }

    if (collected.length >= pageSize) {
      const hasRemainderInBatch = consumed < slice.length;
      const nextPageToken = hasRemainderInBatch
        ? encodeThreadListCursor({
            gmailPageToken: listTokenUsed,
            skip: skipAtBatchStart + consumed,
          })
        : listed.data.nextPageToken
          ? encodeThreadListCursor({
              gmailPageToken: listed.data.nextPageToken,
            })
          : undefined;
      return { threads: collected, nextPageToken };
    }

    gmailToken = listed.data.nextPageToken ?? undefined;
    if (!gmailToken) {
      break;
    }
  }

  return { threads: collected, nextPageToken: undefined };
}

export async function listThreads(
  userId: string,
  options?: {
    maxResults?: number;
    pageToken?: string | null;
    /** When &gt; 1, skip threads with fewer messages and fill each page. */
    minMessages?: number;
    /** Signed-in user's email — used to omit them from inbox row labels. */
    ownerEmail?: string;
  },
): Promise<ListThreadsResult> {
  const pageSize = Math.min(
    500,
    Math.max(1, options?.maxResults ?? THREAD_LIST_PAGE_SIZE),
  );
  const minMessages = Math.max(1, options?.minMessages ?? 1);
  const ownerEmail = options?.ownerEmail;
  const accessToken = await getValidGoogleAccessToken(userId);
  const gmail = gmailClient(accessToken);

  if (minMessages <= 1) {
    const cursor = decodeThreadListCursor(options?.pageToken);
    return listThreadsSimple(gmail, pageSize, cursor.gmailPageToken, ownerEmail);
  }

  return listThreadsMinMessages(
    gmail,
    pageSize,
    minMessages,
    options?.pageToken,
    ownerEmail,
  );
}

export async function getThreadFull(userId: string, threadId: string) {
  const accessToken = await getValidGoogleAccessToken(userId);
  const gmail = gmailClient(accessToken);

  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  return thread.data;
}

/** Raw attachment bytes (Gmail returns base64url). */
export async function fetchGmailAttachment(
  userId: string,
  messageId: string,
  attachmentId: string,
): Promise<Buffer> {
  const accessToken = await getValidGoogleAccessToken(userId);
  const gmail = gmailClient(accessToken);
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });
  const raw = res.data.data;
  if (!raw) {
    throw new Error("Empty attachment payload from Gmail.");
  }
  return Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
