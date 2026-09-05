"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyAddress } from "@/components/copy-address";
import { DeleteStoryConfirmModal } from "@/components/stories/delete-story-confirm-modal";
import { PermanentDeleteStoryModal } from "@/components/stories/permanent-delete-story-modal";
import { StoryDeleteIconButton } from "@/components/stories/story-delete-icon-button";
import { StoriesSearchEmptyGlyph } from "@/components/stories/stories-search-empty-glyph";
import { useAppToast } from "@/components/ui/app-toast";
import { deletedStoryRetentionDays } from "@/lib/story-retention";
import { formatPurgeDetail } from "@/lib/story-purge-label";
import { DIGEST_STATUS_LABEL } from "@/lib/digestExportContent";
import type { Digest } from "@/lib/digest-schema";
import { storyCardExcerpt } from "@/lib/story-card-excerpt";
import { notifyStoriesSummaryChanged } from "@/lib/stories-summary-events";

const FORWARDING_APPROVE_HREF = "/settings/email#forwarding";

export type StoryCardData = {
  id: string;
  title: string;
  subject: string;
  status: string;
  resolutionSummary: string;
  createdAt: string;
  deletedAt?: string | null;
  purgeAt?: string | null;
  isUnread?: boolean;
};

export type QuarantineCardData = {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  createdAt: string;
};

type LibraryItem =
  | { kind: "story"; story: StoryCardData }
  | { kind: "quarantine"; item: QuarantineCardData };

function quarantineMatchesSearch(item: QuarantineCardData, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.subject, item.fromEmail, item.fromName, item.snippet].some((part) =>
    part.toLowerCase().includes(q),
  );
}

function libraryItemDate(item: LibraryItem): string {
  return item.kind === "story" ? item.story.createdAt : item.item.createdAt;
}

function libraryItemKey(item: LibraryItem): string {
  return item.kind === "story" ? item.story.id : `quarantine:${item.item.id}`;
}

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

function storyStatusLabel(status: string): string {
  return (
    DIGEST_STATUS_LABEL[status as Digest["status"]] ??
    status.replace(/_/g, " ")
  );
}

function SectionSelectAllCheckbox({
  checked,
  indeterminate,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="stories-group__select-all">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={`Select all stories in ${label}`}
      />
    </label>
  );
}

function StoriesSearchEmpty({ query }: { query: string }) {
  return (
    <div className="stories-lib__empty stories-lib__empty--search" role="status">
      <StoriesSearchEmptyGlyph />
      <h2 className="stories-lib__empty-title">No stories found</h2>
      <p className="stories-lib__empty-hint">
        Nothing matched &ldquo;{query}&rdquo;. Try another title, subject, or participant name.
      </p>
    </div>
  );
}

export function StoriesLibrary({
  stories: controlledStories,
  onStoriesChange,
  quarantine: controlledQuarantine,
  onQuarantineChange,
  highlightedStoryIds = [],
  inbound,
  isFree,
  verified,
  deletedCount,
  showDeletedBanner = false,
  initialLibraryView = "active",
  onLibraryViewChange,
}: {
  stories: StoryCardData[];
  onStoriesChange: (stories: StoryCardData[]) => void;
  quarantine: QuarantineCardData[];
  onQuarantineChange: (items: QuarantineCardData[]) => void;
  highlightedStoryIds?: string[];
  inbound: string;
  isFree: boolean;
  verified: boolean;
  deletedCount: number;
  showDeletedBanner?: boolean;
  initialLibraryView?: LibraryView;
  onLibraryViewChange?: (view: LibraryView) => void;
}) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const retentionDays = deletedStoryRetentionDays();
  const stories = controlledStories;
  const setStories = onStoriesChange;
  const quarantine = controlledQuarantine;
  const setQuarantine = onQuarantineChange;
  const highlightedStoryIdSet = useMemo(
    () => new Set(highlightedStoryIds),
    [highlightedStoryIds],
  );
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
    onLibraryViewChange?.(libraryView);
  }, [libraryView, onLibraryViewChange]);

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
    const data = (await res.json()) as {
      stories?: StoryCardData[];
      quarantine?: QuarantineCardData[];
    };
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
    if (nextLibraryView === "active") {
      setQuarantine(
        (data.quarantine ?? []).map((item) => ({
          ...item,
          createdAt:
            typeof item.createdAt === "string"
              ? item.createdAt
              : new Date(item.createdAt).toISOString(),
        })),
      );
      notifyStoriesSummaryChanged();
    }
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

  function toggleSectionSelection(sectionIds: string[], checked: boolean) {
    setSelected((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...sectionIds]));
      }
      return current.filter((id) => !sectionIds.includes(id));
    });
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

  const filteredQuarantine = useMemo(
    () => quarantine.filter((item) => quarantineMatchesSearch(item, q)),
    [quarantine, q],
  );

  const groups = useMemo(() => {
    if (libraryView === "deleted") {
      return [
        {
          key: "deleted",
          label: "Recently deleted",
          items: stories.map((story) => ({ kind: "story" as const, story })),
        },
      ];
    }

    const libraryItems: LibraryItem[] = [
      ...stories.map((story) => ({ kind: "story" as const, story })),
      ...filteredQuarantine.map((item) => ({ kind: "quarantine" as const, item })),
    ].sort(
      (a, b) =>
        new Date(libraryItemDate(b)).getTime() - new Date(libraryItemDate(a)).getTime(),
    );

    if (group === "current") {
      return [{ key: "current", label: "This month", items: libraryItems }];
    }

    const map = new Map<string, LibraryItem[]>();
    for (const item of libraryItems) {
      const key =
        group === "year"
          ? yearKey(libraryItemDate(item))
          : monthKey(libraryItemDate(item));
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: group === "year" ? key : monthLabel(key),
      items,
    }));
  }, [stories, filteredQuarantine, group, libraryView]);

  const hasLibraryContent =
    libraryView === "deleted"
      ? stories.length > 0
      : stories.length > 0 || filteredQuarantine.length > 0;

  const isSearchActive = q.trim().length > 0;

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
          <StoryDeleteIconButton
            label={`Delete ${selected.length} selected ${selected.length === 1 ? "story" : "stories"}`}
            disabled={busy}
            onClick={() => requestDelete({ ids: selected })}
          />
        </div>
      ) : null}

      {libraryView === "deleted" && selected.length > 0 ? (
        <div className="stories-lib__bulk">
          <span>{selected.length} selected</span>
          <button type="button" disabled={busy} onClick={() => void restoreSelected()}>
            Restore selected
          </button>
          <StoryDeleteIconButton
            label={`Permanently delete ${selected.length} selected ${selected.length === 1 ? "story" : "stories"}`}
            disabled={busy}
            onClick={() => requestPermanentDelete(selected)}
          />
        </div>
      ) : null}

      {!hasLibraryContent ? (
        isSearchActive ? (
          <StoriesSearchEmpty query={q.trim()} />
        ) : (
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
                    <Link href="/settings/email">Settings → Email & forwarding</Link> so
                    generation can start.
                  </li>
                ) : null}
                <li>
                  Forward a thread from Gmail, Outlook, or Apple Mail to that address.
                </li>
                <li>
                  Keep this page open — your story will appear here automatically, usually
                  within a minute.
                </li>
              </ol>
              <CopyAddress address={inbound} prominent />
            </>
          )}
        </div>
        )
      ) : (
        groups.map((section) => {
          const sectionIds = section.items
            .filter((item) => item.kind === "story")
            .map((item) => item.story.id);
          const sectionSelectedIds = sectionIds.filter((id) => selected.includes(id));
          const sectionAllSelected =
            sectionIds.length > 0 && sectionIds.every((id) => selected.includes(id));
          const sectionSomeSelected = sectionSelectedIds.length > 0;

          return (
          <section key={section.key} className="stories-group">
            <header className="stories-group__head">
              <div className="stories-group__head-main">
                {(libraryView === "active" || libraryView === "deleted") ? (
                  <SectionSelectAllCheckbox
                    checked={sectionAllSelected}
                    indeterminate={sectionSomeSelected && !sectionAllSelected}
                    label={section.label}
                    onChange={(checked) => toggleSectionSelection(sectionIds, checked)}
                  />
                ) : null}
                <h2>
                  {section.label}{" "}
                  <span>({section.items.length})</span>
                </h2>
              </div>
              {libraryView === "active" && sectionSomeSelected ? (
                <StoryDeleteIconButton
                  label={`Delete ${sectionSelectedIds.length} selected ${sectionSelectedIds.length === 1 ? "story" : "stories"} in ${section.label}`}
                  disabled={busy}
                  onClick={() => requestDelete({ ids: sectionSelectedIds })}
                />
              ) : null}
              {libraryView === "deleted" && sectionSomeSelected ? (
                <StoryDeleteIconButton
                  label={`Permanently delete ${sectionSelectedIds.length} selected ${sectionSelectedIds.length === 1 ? "story" : "stories"} in ${section.label}`}
                  disabled={busy}
                  onClick={() => requestPermanentDelete(sectionSelectedIds)}
                />
              ) : null}
            </header>
            {libraryView === "deleted" || view === "cards" ? (
              <ul className="story-cards">
                {section.items.map((entry) => {
                  if (entry.kind === "quarantine") {
                    const item = entry.item;
                    return (
                      <li
                        key={libraryItemKey(entry)}
                        className="story-card story-card--quarantine"
                      >
                        <div className="story-card__body story-card__body--disabled">
                          <div className="story-card__title-row">
                            <h3 className="story-card__title">{item.subject}</h3>
                            <Link
                              href={FORWARDING_APPROVE_HREF}
                              className="story-card__badge story-card__badge--action"
                            >
                              Action needed
                            </Link>
                          </div>
                          <div className="story-card__meta-row">
                            <span className="story-card__status story-card__status--held">
                              Held mail
                            </span>
                            <p className="story-card__meta">
                              {new Date(item.createdAt).toLocaleDateString()}
                              {` · ${item.fromEmail}`}
                            </p>
                          </div>
                          {item.snippet ? (
                            <p className="story-card__excerpt">
                              {storyCardExcerpt(item.snippet)}
                            </p>
                          ) : null}
                          <p className="story-card__quarantine-hint">
                            Approve this sender in{" "}
                            <Link href={FORWARDING_APPROVE_HREF}>Forwarding settings</Link>{" "}
                            to generate a story.
                          </p>
                        </div>
                      </li>
                    );
                  }

                  const story = entry.story;
                  const showNewBadge =
                    Boolean(story.isUnread) || highlightedStoryIdSet.has(story.id);

                  return (
                  <li
                    key={story.id}
                    className={`story-card${libraryView === "deleted" ? " story-card--deleted" : ""}${highlightedStoryIdSet.has(story.id) ? " story-card--new" : ""}`}
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
                    <Link href={`/stories/${story.id}`} className="story-card__link">
                      <div className="story-card__title-row">
                        <h3 className="story-card__title">{story.title}</h3>
                        {libraryView === "active" && showNewBadge ? (
                          <span className="story-card__badge story-card__badge--new">
                            New
                          </span>
                        ) : null}
                      </div>
                      <div className="story-card__meta-row">
                        {libraryView === "active" ? (
                          <span
                            className="story-card__status"
                            data-status={story.status}
                          >
                            {storyStatusLabel(story.status)}
                          </span>
                        ) : null}
                        <p className="story-card__meta">
                          {libraryView === "deleted" && story.deletedAt
                            ? `Deleted ${new Date(story.deletedAt).toLocaleDateString()}`
                            : new Date(story.createdAt).toLocaleDateString()}
                          {story.subject
                            ? ` · ${storyCardExcerpt(story.subject, 52)}`
                            : null}
                        </p>
                      </div>
                      {libraryView === "deleted" && story.purgeAt ? (
                        <p className="story-card__purge-meta">
                          {formatPurgeLabel(story.purgeAt)}
                        </p>
                      ) : libraryView === "active" && story.resolutionSummary ? (
                        <p className="story-card__excerpt">
                          {storyCardExcerpt(story.resolutionSummary)}
                        </p>
                      ) : null}
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
                        {selected.includes(story.id) ? (
                          <StoryDeleteIconButton
                            label={`Permanently delete ${story.title}`}
                            disabled={busy}
                            onClick={() => requestPermanentDelete([story.id])}
                          />
                        ) : null}
                      </div>
                    ) : selected.includes(story.id) ? (
                      <StoryDeleteIconButton
                        label={`Delete ${story.title}`}
                        disabled={busy}
                        className="story-card__delete"
                        onClick={() => requestDelete({ ids: [story.id] })}
                      />
                    ) : null}
                  </li>
                  );
                })}
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
                  {section.items.map((entry) => {
                    if (entry.kind === "quarantine") {
                      const item = entry.item;
                      return (
                        <tr
                          key={libraryItemKey(entry)}
                          className="story-table__row--quarantine"
                        >
                          <td />
                          <td>
                            <span className="story-table__title-link story-table__title-link--disabled">
                              {item.subject}
                            </span>
                            <Link
                              href={FORWARDING_APPROVE_HREF}
                              className="story-card__badge story-card__badge--action"
                            >
                              Action needed
                            </Link>
                          </td>
                          <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td>Held mail</td>
                          <td />
                        </tr>
                      );
                    }

                    const story = entry.story;
                    const showNewBadge =
                      Boolean(story.isUnread) || highlightedStoryIdSet.has(story.id);

                    return (
                    <tr
                      key={story.id}
                      className={highlightedStoryIdSet.has(story.id) ? "story-table__row--new" : undefined}
                    >
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
                        <Link
                          href={`/stories/${story.id}`}
                          className="story-table__title-link"
                        >
                          {story.title}
                        </Link>
                        {libraryView === "active" && showNewBadge ? (
                          <span className="story-card__badge story-card__badge--new story-card__badge--inline">
                            New
                          </span>
                        ) : null}
                      </td>
                      <td>{new Date(story.createdAt).toLocaleDateString()}</td>
                      <td>{story.status.replace("_", " ")}</td>
                      <td>
                        {selected.includes(story.id) ? (
                          <StoryDeleteIconButton
                            label={`Delete ${story.title}`}
                            disabled={busy}
                            onClick={() => requestDelete({ ids: [story.id] })}
                          />
                        ) : null}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
          );
        })
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
