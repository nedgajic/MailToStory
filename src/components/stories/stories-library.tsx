"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CopyAddress } from "@/components/copy-address";
import { DeleteStoryConfirmModal } from "@/components/stories/delete-story-confirm-modal";
import { PermanentDeleteStoryModal } from "@/components/stories/permanent-delete-story-modal";
import { useAppToast } from "@/components/ui/app-toast";
import { deletedStoryRetentionDays } from "@/lib/story-retention";
import { formatPurgeDetail } from "@/lib/story-purge-label";

export type StoryCardData = {
  id: string;
  title: string;
  subject: string;
  status: string;
  resolutionSummary: string;
  createdAt: string;
  deletedAt?: string | null;
  purgeAt?: string | null;
};

type GroupMode = "current" | "month" | "year";
type ViewMode = "cards" | "list";
type LibraryView = "active" | "deleted";

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function yearKey(iso: string): string {
  return String(new Date(iso).getUTCFullYear());
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPurgeLabel(purgeAt: string): string {
  return formatPurgeDetail(purgeAt);
}

export function StoriesLibrary({
  initial,
  inbound,
  isFree,
  verified,
  deletedCount,
  showDeletedBanner = false,
  initialLibraryView = "active",
}: {
  initial: StoryCardData[];
  inbound: string;
  isFree: boolean;
  verified: boolean;
  deletedCount: number;
  showDeletedBanner?: boolean;
  initialLibraryView?: LibraryView;
}) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const retentionDays = deletedStoryRetentionDays();
  const [stories, setStories] = useState(initial);
  const [libraryView, setLibraryView] = useState<LibraryView>(initialLibraryView);
  const [deletedVisible, setDeletedVisible] = useState(deletedCount);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<GroupMode>("month");
  const [view, setView] = useState<ViewMode>("cards");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<{
    payload: { ids?: string[]; month?: string; year?: string };
    count: number;
  } | null>(null);
  const [purgeRequest, setPurgeRequest] = useState<{
    ids: string[];
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!showDeletedBanner) return;
    showToast({
      message: `Story moved to Recently deleted. You can restore it within ${retentionDays} days.`,
      action: {
        label: "View Recently deleted",
        href: "/stories?view=deleted",
      },
    });
    router.replace("/stories", { scroll: false });
  }, [showDeletedBanner, showToast, retentionDays, router]);

  async function refresh(nextQ = q, nextGroup = group, nextLibraryView = libraryView) {
    const params = new URLSearchParams({
      q: nextQ,
      group: nextGroup,
      limit: "200",
      view: nextLibraryView === "deleted" ? "deleted" : "active",
    });
    const res = await fetch(`/api/stories?${params.toString()}`);
    const data = (await res.json()) as { stories?: StoryCardData[] };
    setStories(
      (data.stories ?? []).map((s) => ({
        ...s,
        createdAt:
          typeof s.createdAt === "string"
            ? s.createdAt
            : new Date(s.createdAt).toISOString(),
        deletedAt:
          s.deletedAt == null
            ? null
            : typeof s.deletedAt === "string"
              ? s.deletedAt
              : new Date(s.deletedAt).toISOString(),
        purgeAt:
          s.purgeAt == null
            ? null
            : typeof s.purgeAt === "string"
              ? s.purgeAt
              : new Date(s.purgeAt).toISOString(),
      })),
    );
    if (nextLibraryView === "deleted") {
      setDeletedVisible(data.stories?.length ?? 0);
    }
    setSelected([]);
  }

  async function switchLibraryView(next: LibraryView) {
    setLibraryView(next);
    await refresh(q, group, next);
  }

  async function onSearch(value: string) {
    setQ(value);
    window.clearTimeout((onSearch as { t?: number }).t);
    (onSearch as { t?: number }).t = window.setTimeout(() => {
      void refresh(value, group, libraryView);
    }, 220);
  }

  function requestDelete(payload: {
    ids?: string[];
    month?: string;
    year?: string;
  }) {
    const count = payload.ids?.length
      ? payload.ids.length
      : payload.month
        ? stories.filter((s) => monthKey(s.createdAt) === payload.month).length
        : stories.filter((s) => yearKey(s.createdAt) === payload.year).length;
    setDeleteRequest({ payload, count });
  }

  async function confirmDelete() {
    if (!deleteRequest) return;
    setBusy(true);
    try {
      await fetch("/api/stories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteRequest.payload),
      });
      setDeletedVisible((count) => count + (deleteRequest.count ?? 0));
      await refresh();
      setDeleteRequest(null);
      showToast({
        message: `${deleteRequest.count === 1 ? "Story" : `${deleteRequest.count} stories`} moved to Recently deleted.`,
        action: {
          label: "View Recently deleted",
          onClick: () => void switchLibraryView("deleted"),
        },
      });
    } finally {
      setBusy(false);
    }
  }

  function requestPermanentDelete(ids: string[]) {
    setPurgeRequest({ ids, count: ids.length });
  }

  async function confirmPermanentDelete() {
    if (!purgeRequest) return;
    setBusy(true);
    try {
      await fetch("/api/stories/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: purgeRequest.ids }),
      });
      setDeletedVisible((count) => Math.max(0, count - purgeRequest.count));
      await refresh(q, group, libraryView);
      setPurgeRequest(null);
      showToast({
        message:
          purgeRequest.count === 1
            ? "Story permanently deleted."
            : `${purgeRequest.count} stories permanently deleted.`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function restoreStory(id: string, title: string) {
    setBusy(true);
    try {
      await fetch("/api/stories/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setDeletedVisible((count) => Math.max(0, count - 1));
      showToast({ message: `"${title}" restored to your library.` });
      router.push(`/stories/${id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function restoreSelected() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      await fetch("/api/stories/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      setDeletedVisible((count) => Math.max(0, count - selected.length));
      await refresh(q, group, libraryView);
      showToast({
        message:
          selected.length === 1
            ? "Story restored to your library."
            : `${selected.length} stories restored to your library.`,
      });
      setSelected([]);
    } finally {
      setBusy(false);
    }
  }

  const groups = useMemo(() => {
    if (libraryView === "deleted") {
      return [{ key: "deleted", label: "Recently deleted", items: stories }];
    }
    if (group === "current") {
      return [{ key: "current", label: "This month", items: stories }];
    }
    const map = new Map<string, StoryCardData[]>();
    for (const story of stories) {
      const key = group === "year" ? yearKey(story.createdAt) : monthKey(story.createdAt);
      const list = map.get(key) ?? [];
      list.push(story);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: group === "year" ? key : monthLabel(key),
      items,
    }));
  }, [stories, group, libraryView]);

  return (
    <div className="stories-lib">
      <div className="stories-lib__view-tabs" role="tablist" aria-label="Story library views">
        <button
          type="button"
          role="tab"
          aria-selected={libraryView === "active"}
          className={libraryView === "active" ? "is-active" : ""}
          onClick={() => void switchLibraryView("active")}
        >
          All stories
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={libraryView === "deleted"}
          className={libraryView === "deleted" ? "is-active" : ""}
          onClick={() => void switchLibraryView("deleted")}
        >
          Recently deleted
          {deletedVisible > 0 ? <span className="stories-lib__tab-count">{deletedVisible}</span> : null}
        </button>
      </div>

      {libraryView === "deleted" ? (
        <p className="stories-lib__deleted-intro">
          Deleted stories and their forwarded email stay here for {retentionDays} days, then are
          permanently removed. You can restore them or delete them permanently now.
        </p>
      ) : null}

      <div className="stories-lib__toolbar">
        <input
          className="stories-lib__search"
          placeholder="Search title, subject, people…"
          value={q}
          onChange={(e) => void onSearch(e.target.value)}
        />
        {libraryView === "active" ? (
          <>
            <div className="stories-lib__toggles" role="group" aria-label="Group stories">
              {(
                [
                  ["current", "This month"],
                  ["month", "By month"],
                  ["year", "By year"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={group === id ? "is-active" : ""}
                  onClick={() => {
                    setGroup(id);
                    void refresh(q, id, libraryView);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="stories-lib__toggles" role="group" aria-label="View">
              <button
                type="button"
                className={view === "cards" ? "is-active" : ""}
                onClick={() => setView("cards")}
              >
                Cards
              </button>
              <button
                type="button"
                className={view === "list" ? "is-active" : ""}
                onClick={() => setView("list")}
              >
                List
              </button>
            </div>
          </>
        ) : null}
      </div>

      {libraryView === "active" && selected.length > 0 ? (
        <div className="stories-lib__bulk">
          <span>{selected.length} selected</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => requestDelete({ ids: selected })}
          >
            Move to Recently deleted
          </button>
        </div>
      ) : null}

      {libraryView === "deleted" && selected.length > 0 ? (
        <div className="stories-lib__bulk">
          <span>{selected.length} selected</span>
          <button type="button" disabled={busy} onClick={() => void restoreSelected()}>
            Restore selected
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => requestPermanentDelete(selected)}
          >
            Delete permanently
          </button>
        </div>
      ) : null}

      {stories.length === 0 ? (
        <div className="dash-empty">
          {libraryView === "deleted" ? (
            <>
              <h2>No recently deleted stories</h2>
              <p>
                When you delete a story, it appears here for 30 days before being permanently removed.
              </p>
            </>
          ) : (
            <>
              <h2>No stories yet</h2>
              <p>Complete these steps to create your first story:</p>
              <ol className="stories-checklist">
                <li>Copy your private forwarding address below.</li>
                {!verified ? (
                  <li>
                    Verify your email in{" "}
                    <Link href="/settings/profile">Settings → Profile</Link> so
                    generation can start.
                  </li>
                ) : null}
                <li>
                  Forward a thread from Gmail, Outlook, or Apple Mail to that address.
                </li>
                <li>Open this page again — your story usually appears within a minute.</li>
              </ol>
              <CopyAddress address={inbound} prominent />
            </>
          )}
        </div>
      ) : (
        groups.map((section) => (
          <section key={section.key} className="stories-group">
            <header className="stories-group__head">
              <h2>
                {section.label}{" "}
                <span>({section.items.length})</span>
              </h2>
              {libraryView === "active" && group !== "current" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    requestDelete(
                      group === "year"
                        ? { year: section.key }
                        : { month: section.key },
                    )
                  }
                >
                  Move {group === "year" ? "this year" : "this month"} to Recently deleted
                </button>
              ) : null}
            </header>
            {libraryView === "deleted" || view === "cards" ? (
              <ul className="story-cards">
                {section.items.map((story) => (
                  <li
                    key={story.id}
                    className={`story-card${libraryView === "deleted" ? " story-card--deleted" : ""}`}
                  >
                    <label className="story-card__check">
                      <input
                        type="checkbox"
                        checked={selected.includes(story.id)}
                        onChange={(e) =>
                          setSelected((cur) =>
                            e.target.checked
                              ? [...cur, story.id]
                              : cur.filter((id) => id !== story.id),
                          )
                        }
                      />
                    </label>
                    <Link href={`/stories/${story.id}`}>
                      <h3>{story.title}</h3>
                      <p className="story-card__meta">
                        {story.subject} ·{" "}
                        {libraryView === "deleted" && story.deletedAt
                          ? `Deleted ${new Date(story.deletedAt).toLocaleDateString()}`
                          : new Date(story.createdAt).toLocaleDateString()}
                      </p>
                      {libraryView === "deleted" && story.purgeAt ? (
                        <p className="story-card__purge-meta">{formatPurgeLabel(story.purgeAt)}</p>
                      ) : (
                        <p>{story.resolutionSummary}</p>
                      )}
                    </Link>
                    {libraryView === "deleted" ? (
                      <div className="story-card__deleted-actions">
                        <button
                          type="button"
                          className="story-card__restore"
                          disabled={busy}
                          onClick={() => void restoreStory(story.id, story.title)}
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          className="story-card__purge"
                          disabled={busy}
                          onClick={() => requestPermanentDelete([story.id])}
                        >
                          Delete permanently
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="story-card__delete"
                        disabled={busy}
                        onClick={() => requestDelete({ ids: [story.id] })}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <table className="story-table">
                <thead>
                  <tr>
                    <th />
                    <th>Title</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((story) => (
                    <tr key={story.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(story.id)}
                          onChange={(e) =>
                            setSelected((cur) =>
                              e.target.checked
                                ? [...cur, story.id]
                                : cur.filter((id) => id !== story.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <Link href={`/stories/${story.id}`}>{story.title}</Link>
                      </td>
                      <td>{new Date(story.createdAt).toLocaleDateString()}</td>
                      <td>{story.status.replace("_", " ")}</td>
                      <td>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => requestDelete({ ids: [story.id] })}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))
      )}
      <DeleteStoryConfirmModal
        open={deleteRequest !== null}
        count={deleteRequest?.count ?? 1}
        isFree={isFree}
        busy={busy}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={confirmDelete}
      />
      <PermanentDeleteStoryModal
        open={purgeRequest !== null}
        count={purgeRequest?.count ?? 1}
        busy={busy}
        onCancel={() => setPurgeRequest(null)}
        onConfirm={confirmPermanentDelete}
      />
    </div>
  );
}
