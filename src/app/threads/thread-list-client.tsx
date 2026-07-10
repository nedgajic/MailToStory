"use client";

import type { ThreadListItem } from "@/lib/gmail";
import { THREAD_LIST_PAGE_SIZE, minMessagesForThreadsOnly } from "@/lib/thread-list-constants";
import { formatGmailListDate } from "@/lib/formatGmailListDate";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ThreadsApiOk = {
  threads: ThreadListItem[];
  nextPageToken: string | null;
};

type PageSlice = {
  threads: ThreadListItem[];
  nextPageToken: string | null;
};

function threadsApiParams(
  threadsOnly: boolean,
  pageToken?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    minMessages: String(minMessagesForThreadsOnly(threadsOnly)),
  });
  if (pageToken) params.set("pageToken", pageToken);
  return params;
}

function IconRefresh() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0114.9-3.5M20 12a8 8 0 01-14.9 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 3v4h4M7 21v-4H3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M15.4 7.4L14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6z"
      />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M8.6 6L7.2 7.4l4.6 4.6-4.6 4.6L8.6 18l6-6-6-6z"
      />
    </svg>
  );
}

function formatTotal(n: number): string {
  return n.toLocaleString("en-US");
}

function paginationLabel(
  pageIndex: number,
  count: number,
  hasMore: boolean,
): string {
  if (count === 0) {
    return hasMore ? "0 of many" : "0";
  }
  const start = pageIndex * THREAD_LIST_PAGE_SIZE + 1;
  const end = pageIndex * THREAD_LIST_PAGE_SIZE + count;
  return hasMore
    ? `${formatTotal(start)}–${formatTotal(end)} of many`
    : `${formatTotal(start)}–${formatTotal(end)} of ${formatTotal(end)}`;
}

export function ThreadListClient({
  initialThreads,
  initialNextPageToken,
  threadsOnly,
}: {
  initialThreads: ThreadListItem[];
  initialNextPageToken: string | null;
  threadsOnly: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pages, setPages] = useState<PageSlice[]>([
    { threads: initialThreads, nextPageToken: initialNextPageToken },
  ]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const useInitialSsrPage = useRef(true);

  const fetchFirstPage = useCallback(async (onlyThreads: boolean) => {
    setPaginationError(null);
    setLoadingPage(true);
    try {
      const res = await fetch(
        `/api/threads?${threadsApiParams(onlyThreads).toString()}`,
      );
      const data = (await res.json()) as ThreadsApiOk & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load threads");
      }
      setPages([
        { threads: data.threads, nextPageToken: data.nextPageToken },
      ]);
      setPageIndex(0);
    } catch (e) {
      setPaginationError(
        e instanceof Error ? e.message : "Failed to load threads",
      );
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    if (useInitialSsrPage.current && threadsOnly) {
      useInitialSsrPage.current = false;
      return;
    }
    useInitialSsrPage.current = false;
    void fetchFirstPage(threadsOnly);
  }, [threadsOnly, fetchFirstPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentPage = pages[pageIndex] ?? pages[0];
  const hasMore = Boolean(currentPage?.nextPageToken);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = currentPage?.threads ?? [];
    if (!q) return base;
    return base.filter((t) => {
      return (
        t.subject.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q)
      );
    });
  }, [currentPage, query]);

  const rangeLabel = paginationLabel(pageIndex, filtered.length, hasMore);

  const canGoNewer = pageIndex > 0;
  const canGoOlder = pageIndex < pages.length - 1 || hasMore;

  const goNewer = useCallback(() => {
    if (pageIndex > 0) setPageIndex((i) => i - 1);
  }, [pageIndex]);

  const goOlder = useCallback(async () => {
    if (loadingPage) return;

    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1);
      return;
    }

    const token = currentPage?.nextPageToken;
    if (!token) return;

    setPaginationError(null);
    setLoadingPage(true);
    try {
      const res = await fetch(
        `/api/threads?${threadsApiParams(threadsOnly, token).toString()}`,
      );
      const data = (await res.json()) as ThreadsApiOk & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load older threads");
      }
      setPages((prev) => [
        ...prev,
        { threads: data.threads, nextPageToken: data.nextPageToken },
      ]);
      setPageIndex((i) => i + 1);
    } catch (e) {
      setPaginationError(
        e instanceof Error ? e.message : "Failed to load older threads",
      );
    } finally {
      setLoadingPage(false);
    }
  }, [loadingPage, pageIndex, pages.length, currentPage?.nextPageToken, threadsOnly]);

  return (
    <>
      <div className="threads-inbox-search-row">
        <input
          ref={inputRef}
          id="thread-search"
          type="search"
          className="thread-search-input-inbox threads-inbox-search"
          placeholder="Search threads ( / )"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="gmail-inbox-list-wrap">
        <div className="gmail-inbox-toolbar" role="toolbar" aria-label="Inbox">
          <div className="gmail-inbox-toolbar-left">
            <button
              type="button"
              className="gmail-inbox-tool"
              title="Refresh"
              aria-label="Refresh"
              onClick={() => router.refresh()}
            >
              <IconRefresh />
            </button>
          </div>
          <div className="gmail-inbox-toolbar-right">
            <span className="gmail-inbox-range" aria-live="polite">
              {loadingPage ? "Loading…" : rangeLabel}
            </span>
            <button
              type="button"
              className="gmail-inbox-tool gmail-inbox-tool--nav"
              disabled={!canGoNewer || loadingPage}
              aria-label="Newer threads"
              title="Newer"
              onClick={goNewer}
            >
              <IconChevronLeft />
            </button>
            <button
              type="button"
              className="gmail-inbox-tool gmail-inbox-tool--nav"
              disabled={!canGoOlder || loadingPage}
              aria-label="Older threads"
              title="Older"
              onClick={() => void goOlder()}
            >
              <IconChevronRight />
            </button>
          </div>
        </div>

        <ul className="gmail-inbox-list gmail-inbox-list--simple">
          {filtered.map((t) => {
            const multi = t.messageCount >= 2;
            return (
              <li
                key={t.id}
                className={multi ? "gmail-inbox-li gmail-inbox-li--multi" : "gmail-inbox-li"}
              >
                <Link
                  href={`/threads/${encodeURIComponent(t.id)}`}
                  className="gmail-inbox-row gmail-inbox-row--simple"
                >
                  <span className="gmail-inbox-from">{t.from || "Unknown"}</span>
                  <span className="gmail-inbox-middle">
                    <span className="gmail-inbox-subject">{t.subject}</span>
                    {t.snippet ? (
                      <>
                        <span className="gmail-inbox-dash"> — </span>
                        <span className="gmail-inbox-snippet">{t.snippet}</span>
                      </>
                    ) : null}
                  </span>
                  {multi ? (
                    <span className="gmail-inbox-count-col gmail-inbox-count-col--multi">
                      {t.messageCount}
                    </span>
                  ) : null}
                  <span className="gmail-inbox-date">
                    {formatGmailListDate(t.date)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {filtered.length === 0 && !loadingPage && (currentPage?.threads.length ?? 0) === 0 ? (
        <p className="threads-inbox-empty">No threads on this page.</p>
      ) : null}

      {filtered.length === 0 && (currentPage?.threads.length ?? 0) > 0 ? (
        <p className="threads-inbox-empty">No matches on this page.</p>
      ) : null}

      {paginationError ? (
        <p className="threads-inbox-error" role="alert">
          {paginationError}
        </p>
      ) : null}
    </>
  );
}
