"use client";

import { DEFAULT_THREADS_ONLY } from "@/lib/thread-list-constants";
import { ThreadListClient } from "./thread-list-client";
import { ThreadsInboxHeader } from "./threads-inbox-header";
import { InboxSplitLayout } from "@/components/thread/InboxSplitLayout";
import type { ThreadListItem } from "@/lib/gmail";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function InboxClient({
  email,
  initialThreads,
  initialNextPageToken,
  initialSelectedThreadId = null,
}: {
  email: string | null | undefined;
  initialThreads: ThreadListItem[];
  initialNextPageToken: string | null;
  initialSelectedThreadId?: string | null;
}) {
  const router = useRouter();
  const [threadsOnly, setThreadsOnly] = useState(DEFAULT_THREADS_ONLY);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialSelectedThreadId,
  );

  useEffect(() => {
    setSelectedThreadId(initialSelectedThreadId);
  }, [initialSelectedThreadId]);

  const selectThread = useCallback(
    (threadId: string | null) => {
      setSelectedThreadId(threadId);
      const url = threadId
        ? `/threads?thread=${encodeURIComponent(threadId)}`
        : "/threads";
      router.replace(url, { scroll: false });
    },
    [router],
  );

  return (
    <>
      <ThreadsInboxHeader
        email={email}
        threadsOnly={threadsOnly}
        onThreadsOnlyChange={setThreadsOnly}
      />
      <InboxSplitLayout
        selectedThreadId={selectedThreadId}
        onCloseThread={() => selectThread(null)}
        list={
          <ThreadListClient
            initialThreads={initialThreads}
            initialNextPageToken={initialNextPageToken}
            threadsOnly={threadsOnly}
            selectedThreadId={selectedThreadId}
            onSelectThread={(id) => selectThread(id)}
          />
        }
      />
    </>
  );
}
