import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { listThreads } from "@/lib/gmail";
import { THREAD_LIST_PAGE_SIZE } from "@/lib/thread-list-constants";
import { AppTopBar } from "@/components/app-top-bar";
import { ThreadListClient } from "./thread-list-client";
import { ThreadsInboxHeader } from "./threads-inbox-header";

export default async function ThreadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  let threadsResult: Awaited<ReturnType<typeof listThreads>> | null = null;
  let loadError: string | null = null;

  try {
    threadsResult = await listThreads(session.user.id, {
      maxResults: THREAD_LIST_PAGE_SIZE,
    });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load inbox";
  }

  const threads = threadsResult?.threads ?? [];
  const initialNextPageToken = threadsResult?.nextPageToken ?? null;

  return (
    <>
      <AppTopBar contentMaxWidth="inbox" />
      <main className="threads-inbox-shell">
        <ThreadsInboxHeader email={session.user.email} />

        {loadError ? (
          <p className="threads-inbox-error" role="alert">
            {loadError}
          </p>
        ) : null}

        {!loadError && threads.length > 0 ? (
          <ThreadListClient
            initialThreads={threads}
            initialNextPageToken={initialNextPageToken}
          />
        ) : null}

        {!loadError && threads.length === 0 ? (
          <p className="threads-inbox-empty">
            No threads returned for this inbox. Try again later or check Gmail
            connectivity.
          </p>
        ) : null}
      </main>
    </>
  );
}
