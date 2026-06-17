"use client";

import type { ThreadListItem } from "@/lib/gmail";
import { THREAD_LIST_PAGE_SIZE } from "@/lib/thread-list-constants";
import { formatGmailListDate } from "@/lib/formatGmailListDate";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ThreadsApiOk = {
  threads: ThreadListItem[];
  nextPageToken: string | null;
};

function IconCheckbox() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="gmail-inbox-icon"
    >
      <rect
        x="3.5"
        y="3.5"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="gmail-inbox-icon"
    >
      <path
        d="M12 4.5l1.9 4.9 5.3.4-4 3.3 1.2 5.2L12 15.9 7.6 18.3l1.2-5.2-4-3.3 5.3-.4L12 4.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="gmail-inbox-icon"
    >
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

export function ThreadListClient({
  initialThreads,
  initialNextPageToken,
}: {
  initialThreads: ThreadListItem[];
  initialNextPageToken: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ThreadListItem[]>(initialThreads);
  const [nextPageToken, setNextPageToken] = useState<string | null>(
    initialNextPageToken,
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showMode, setShowMode] = useState<"all" | "threads-only">(
    "threads-only",
  );
  const [minInteractions, setMinInteractions] = useState(2);
  const minInteractionsClamped = Math.max(
    1,
    Math.min(999, Number.isFinite(minInteractions) ? minInteractions : 2),
  );

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

  const loadOlder = useCallback(async () => {
    if (!nextPageToken || loadingOlder) return;
    setPaginationError(null);
    setLoadingOlder(true);
    try {
      const params = new URLSearchParams({ pageToken: nextPageToken });
      const res = await fetch(`/api/threads?${params}`);
      const data = (await res.json()) as ThreadsApiOk & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load older threads");
      }
      setThreads((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        const merged = [...prev];
        for (const t of data.threads) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            merged.push(t);
          }
        }
        return merged;
      });
      setNextPageToken(data.nextPageToken);
    } catch (e) {
      setPaginationError(
        e instanceof Error ? e.message : "Failed to load older threads",
      );
    } finally {
      setLoadingOlder(false);
    }
  }, [nextPageToken, loadingOlder]);

  const afterInteractionFilter = useMemo(() => {
    if (showMode === "all") return threads;
    return threads.filter((t) => t.messageCount >= minInteractionsClamped);
  }, [threads, showMode, minInteractionsClamped]);

  useEffect(() => {
    if (showMode !== "threads-only") return;
    if (loadingOlder) return;
    if (paginationError) return;
    if (!nextPageToken) return;
    if (afterInteractionFilter.length >= THREAD_LIST_PAGE_SIZE) return;
    if (threads.length >= THREAD_LIST_PAGE_SIZE * 10) return;
    const id = window.setTimeout(() => {
      void loadOlder();
    }, 0);
    return () => window.clearTimeout(id);
  }, [
    showMode,
    loadingOlder,
    paginationError,
    nextPageToken,
    afterInteractionFilter.length,
    threads.length,
    loadOlder,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return afterInteractionFilter;
    return afterInteractionFilter.filter((t) => {
      const sub = t.subject.toLowerCase();
      const snip = t.snippet.toLowerCase();
      const d = t.date.toLowerCase();
      const countStr = String(t.messageCount);
      const from = t.from.toLowerCase();
      return (
        sub.includes(q) ||
        snip.includes(q) ||
        d.includes(q) ||
        countStr === q ||
        from.includes(q)
      );
    });
  }, [afterInteractionFilter, query]);

  const rangeLabel =
    threads.length === 0
      ? "0–0"
      : `1–${threads.length}${nextPageToken ? "+" : ""}`;

  return (
    <>
      <div className="gmail-inbox-toolbar" role="toolbar" aria-label="Inbox">
        <div className="gmail-inbox-toolbar-left">
          <span
            className="gmail-inbox-tool gmail-inbox-tool--ghost"
            aria-hidden
            title="Select"
          >
            <IconCheckbox />
          </span>
          <button
            type="button"
            className="gmail-inbox-tool"
            title="Refresh list"
            aria-label="Refresh list"
            onClick={() => router.refresh()}
          >
            <IconRefresh />
          </button>
        </div>
        <div className="gmail-inbox-toolbar-right">
          <span className="gmail-inbox-range" aria-live="polite">
            {rangeLabel}
            {nextPageToken ? " of many" : threads.length > 0 ? " shown" : ""}
          </span>
          <button
            type="button"
            className="gmail-inbox-tool gmail-inbox-tool--nav"
            disabled
            aria-label="Newer threads (not available)"
            title="Newer threads"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className="gmail-inbox-tool gmail-inbox-tool--nav"
            disabled={!nextPageToken || loadingOlder}
            aria-label="Older threads"
            title="Older threads"
            onClick={() => void loadOlder()}
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <fieldset className="gmail-inbox-show-filter">
        <legend>Show in list</legend>
        <div className="gmail-inbox-show-filter-row">
          <label className="gmail-inbox-radio">
            <input
              type="radio"
              name="inbox-show-mode"
              checked={showMode === "all"}
              onChange={() => setShowMode("all")}
            />
            <span>All mail</span>
          </label>
          <div className="gmail-inbox-show-threads-with-min">
            <label className="gmail-inbox-radio">
              <input
                type="radio"
                name="inbox-show-mode"
                checked={showMode === "threads-only"}
                onChange={() => setShowMode("threads-only")}
              />
              <span>Threads only</span>
            </label>
            <label
              className={`gmail-inbox-min-interactions${showMode === "threads-only" ? "" : " gmail-inbox-min-interactions--disabled"}`}
              htmlFor="min-interactions"
            >
              <span className="gmail-inbox-min-label">Min. interactions</span>
              <input
                id="min-interactions"
                className="gmail-inbox-min-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                disabled={showMode !== "threads-only"}
                value={minInteractionsClamped}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  if (Number.isNaN(raw)) {
                    setMinInteractions(1);
                    return;
                  }
                  setMinInteractions(Math.min(999, Math.max(1, raw)));
                }}
              />
            </label>
          </div>
        </div>
        {showMode === "threads-only" ? (
          <p className="gmail-inbox-show-hint">
            Showing conversations with at least {minInteractionsClamped}{" "}
            message
            {minInteractionsClamped === 1 ? "" : "s"} (
            {afterInteractionFilter.length} of {threads.length} loaded; up to{" "}
            {THREAD_LIST_PAGE_SIZE} matching rows when available).
          </p>
        ) : null}
      </fieldset>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="thread-search" className="thread-search-label-inbox">
          Search in list
        </label>
        <input
          ref={inputRef}
          id="thread-search"
          type="search"
          className="thread-search-input-inbox"
          placeholder="Filter by sender, subject, or preview… (press /)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
        />
        {query.trim() || showMode === "threads-only" ? (
          <p className="thread-search-meta-inbox">
            {filtered.length} shown
            {query.trim() && showMode === "threads-only"
              ? ` (search + ≥${minInteractionsClamped} msgs)`
              : query.trim()
                ? " (search)"
                : showMode === "threads-only"
                  ? ` (≥${minInteractionsClamped} msgs)`
                  : ""}
            {" · "}
            {threads.length} loaded
          </p>
        ) : null}
      </div>

      <div className="gmail-inbox-list-wrap">
        <div className="gmail-inbox-row-wrap gmail-inbox-list-header">
          <div className="gmail-inbox-gutter gmail-inbox-gutter--spacer" />
          <div className="gmail-inbox-row gmail-inbox-row--header-cells">
            <span className="gmail-inbox-from">From</span>
            <span className="gmail-inbox-middle">Subject</span>
            <span className="gmail-inbox-count-col gmail-inbox-count-col--header">
              Msgs
            </span>
            <span className="gmail-inbox-date">Date</span>
          </div>
        </div>
        <ul className="gmail-inbox-list">
          {filtered.map((t) => {
            const multi = t.messageCount >= 2;
            const rowClass = [
              "gmail-inbox-row",
              !multi ? "gmail-inbox-row--single" : "",
              t.unread ? "gmail-inbox-row--unread" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const dateShort = formatGmailListDate(t.date);

            return (
              <li
                key={t.id}
                className={[
                  "gmail-inbox-li",
                  t.unread ? "gmail-inbox-li--unread" : "",
                  multi ? "gmail-inbox-li--multi" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="gmail-inbox-row-wrap">
                  <div
                    className="gmail-inbox-gutter"
                    aria-hidden
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="gmail-inbox-gutter-btn">
                      <IconCheckbox />
                    </span>
                    <span className="gmail-inbox-gutter-btn">
                      <IconStar />
                    </span>
                  </div>
                  <Link
                    href={`/threads/${encodeURIComponent(t.id)}`}
                    className={rowClass}
                  >
                    <span className="gmail-inbox-from">{t.from}</span>
                    <span className="gmail-inbox-middle">
                      <span className="gmail-inbox-subject">{t.subject}</span>
                      <span className="gmail-inbox-dash"> — </span>
                      <span className="gmail-inbox-snippet">{t.snippet}</span>
                    </span>
                    <span
                      className={
                        multi
                          ? "gmail-inbox-count-col gmail-inbox-count-col--multi"
                          : "gmail-inbox-count-col"
                      }
                      title={`${t.messageCount} message${t.messageCount === 1 ? "" : "s"} in thread`}
                    >
                      {t.messageCount}
                    </span>
                    <span className="gmail-inbox-date">{dateShort}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {filtered.length === 0 && threads.length > 0 ? (
        <p className="gmail-inbox-empty-filter">
          {afterInteractionFilter.length === 0 && showMode === "threads-only"
            ? `No loaded threads have at least ${minInteractionsClamped} message${minInteractionsClamped === 1 ? "" : "s"}. Lower the minimum or choose “All mail”, or load older threads.`
            : `No threads match “${query.trim()}”. Clear the filter to see all.`}
        </p>
      ) : null}

      {paginationError ? (
        <p className="thread-list-pagination-error-inbox" role="alert">
          {paginationError}
        </p>
      ) : null}

      <div className="thread-list-pagination-inbox">
        {nextPageToken ? (
          <button
            type="button"
            className="thread-list-pagination-btn-inbox"
            onClick={() => void loadOlder()}
            disabled={loadingOlder}
          >
            {loadingOlder ? "Loading…" : "Load older threads"}
          </button>
        ) : threads.length > 0 ? (
          <p className="thread-list-pagination-end-inbox">
            No more pages from Gmail for this inbox.
          </p>
        ) : null}
      </div>
    </>
  );
}
