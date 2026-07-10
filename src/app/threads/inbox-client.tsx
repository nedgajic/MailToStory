"use client";

import { DEFAULT_THREADS_ONLY } from "@/lib/thread-list-constants";
import { ThreadListClient } from "./thread-list-client";
import { ThreadsInboxHeader } from "./threads-inbox-header";
import type { ThreadListItem } from "@/lib/gmail";
import { useState } from "react";

export function InboxClient({
  email,
  initialThreads,
  initialNextPageToken,
}: {
  email: string | null | undefined;
  initialThreads: ThreadListItem[];
  initialNextPageToken: string | null;
}) {
  const [threadsOnly, setThreadsOnly] = useState(DEFAULT_THREADS_ONLY);

  return (
    <>
      <ThreadsInboxHeader
        email={email}
        threadsOnly={threadsOnly}
        onThreadsOnlyChange={setThreadsOnly}
      />
      <ThreadListClient
        initialThreads={initialThreads}
        initialNextPageToken={initialNextPageToken}
        threadsOnly={threadsOnly}
      />
    </>
  );
}
