import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { ReconnectGooglePanel } from "@/components/reconnect-google-panel";
import { GoogleReconnectRequiredError } from "@/lib/google-auth-errors";
import { listThreads } from "@/lib/gmail";
import { THREAD_LIST_PAGE_SIZE, DEFAULT_THREADS_ONLY, minMessagesForThreadsOnly } from "@/lib/thread-list-constants";
import { AppTopBar } from "@/components/app-top-bar";
import { InboxClient } from "./inbox-client";

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { thread: threadParam } = await searchParams;
  const initialSelectedThreadId = threadParam?.trim() || null;

  let threadsResult: Awaited<ReturnType<typeof listThreads>> | null = null;
  let loadError: string | null = null;
  let needsGoogleReconnect = false;

  try {
    threadsResult = await listThreads(session.user.id, {
      maxResults: THREAD_LIST_PAGE_SIZE,
      minMessages: minMessagesForThreadsOnly(DEFAULT_THREADS_ONLY),
      ownerEmail: session.user.email ?? undefined,
    });
  } catch (e) {
    if (e instanceof GoogleReconnectRequiredError) {
      needsGoogleReconnect = true;
    } else {
      loadError = e instanceof Error ? e.message : "Failed to load inbox";
    }
  }

  const threads = threadsResult?.threads ?? [];
  const initialNextPageToken = threadsResult?.nextPageToken ?? null;
  const hasInboxContent = threads.length > 0 || Boolean(initialNextPageToken);

  return (
    <>
      <AppTopBar contentMaxWidth="inbox" />
      <main className="threads-inbox-shell">
        {needsGoogleReconnect ? <ReconnectGooglePanel /> : null}

        {loadError ? (
          <p className="threads-inbox-error" role="alert">
            {loadError}
          </p>
        ) : null}

        {!loadError && !needsGoogleReconnect && hasInboxContent ? (
          <InboxClient
            email={session.user.email}
            initialThreads={threads}
            initialNextPageToken={initialNextPageToken}
            initialSelectedThreadId={initialSelectedThreadId}
          />
        ) : null}

        {!loadError && !needsGoogleReconnect && !hasInboxContent ? (
          <p className="threads-inbox-empty">No threads in inbox.</p>
        ) : null}
      </main>
    </>
  );
}
