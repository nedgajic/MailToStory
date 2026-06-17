import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/google-token";
import { parseFromDisplayName } from "@/lib/parseFromHeader";
import {
  THREAD_LIST_METADATA_CONCURRENCY,
  THREAD_LIST_PAGE_SIZE,
} from "@/lib/thread-list-constants";

function gmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export type ThreadListItem = {
  id: string;
  subject: string;
  snippet: string;
  /** Raw `Date` header from the latest message (for inbox-style formatting). */
  date: string;
  /** Gmail messages in this thread (1 = standalone email, still digestible). */
  messageCount: number;
  /** Display name from the latest message’s `From` header. */
  from: string;
  /** True if any message in the thread still has the UNREAD label. */
  unread: boolean;
};

export type ListThreadsResult = {
  threads: ThreadListItem[];
  /** Pass to the next `listThreads` / API call to fetch older threads. */
  nextPageToken?: string;
};

export async function listThreads(
  userId: string,
  options?: { maxResults?: number; pageToken?: string | null },
): Promise<ListThreadsResult> {
  const maxResults = Math.min(
    500,
    Math.max(1, options?.maxResults ?? THREAD_LIST_PAGE_SIZE),
  );
  const accessToken = await getValidGoogleAccessToken(userId);
  const gmail = gmailClient(accessToken);

  const listed = await gmail.users.threads.list({
    userId: "me",
    maxResults,
    pageToken: options?.pageToken ?? undefined,
  });

  const refs = (listed.data.threads ?? []).filter((r) => r.id);
  const concurrency = Math.max(
    1,
    Math.min(THREAD_LIST_METADATA_CONCURRENCY, refs.length),
  );

  async function fetchOne(ref: { id?: string | null }): Promise<ThreadListItem> {
    const id = ref.id!;
    const thread = await gmail.users.threads.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: ["Subject", "Date", "From"],
    });

    const messages = thread.data.messages ?? [];
    const last = messages[messages.length - 1];
    const headers = last?.payload?.headers ?? [];
    const subject =
      headers.find((h) => h.name?.toLowerCase() === "subject")?.value ??
      "(no subject)";
    const date =
      headers.find((h) => h.name?.toLowerCase() === "date")?.value ?? "";
    const fromRaw =
      headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";

    const unread = messages.some((m) =>
      Boolean(m.labelIds?.includes("UNREAD")),
    );

    return {
      id,
      subject,
      snippet: thread.data.snippet ?? "",
      date,
      messageCount: messages.length,
      from: parseFromDisplayName(fromRaw),
      unread,
    };
  }

  const items: ThreadListItem[] = [];
  for (let i = 0; i < refs.length; i += concurrency) {
    const chunk = refs.slice(i, i + concurrency);
    const batch = await Promise.all(chunk.map((ref) => fetchOne(ref)));
    items.push(...batch);
  }

  return {
    threads: items,
    nextPageToken: listed.data.nextPageToken ?? undefined,
  };
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
