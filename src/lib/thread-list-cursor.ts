export type ThreadListCursor = {
  /** Gmail `threads.list` page token for the batch being (partially) consumed. */
  gmailPageToken?: string;
  /** Matching threads to skip at the start of that batch (multi-message filter). */
  skip?: number;
};

export function encodeThreadListCursor(
  cursor: ThreadListCursor | null | undefined,
): string | undefined {
  if (!cursor) return undefined;
  if (!cursor.gmailPageToken && !cursor.skip) return undefined;
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** Accepts our encoded cursor or a legacy raw Gmail page token. */
export function decodeThreadListCursor(
  token: string | null | undefined,
): ThreadListCursor {
  if (!token) return {};
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    );
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as ThreadListCursor;
    }
  } catch {
    /* raw Gmail token */
  }
  return { gmailPageToken: token };
}
