"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyAddress } from "@/components/copy-address";

export type StoryCardData = {
  id: string;
  title: string;
  subject: string;
  status: string;
  resolutionSummary: string;
  createdAt: string;
};

type GroupMode = "current" | "month" | "year";
type ViewMode = "cards" | "list";

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

export function StoriesLibrary({
  initial,
  inbound,
  isFree,
}: {
  initial: StoryCardData[];
  inbound: string;
  isFree: boolean;
}) {
  const [stories, setStories] = useState(initial);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<GroupMode>("month");
  const [view, setView] = useState<ViewMode>("cards");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh(nextQ = q, nextGroup = group) {
    const params = new URLSearchParams({
      q: nextQ,
      group: nextGroup,
      limit: "200",
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
      })),
    );
    setSelected([]);
  }

  async function onSearch(value: string) {
    setQ(value);
    window.clearTimeout((onSearch as { t?: number }).t);
    (onSearch as { t?: number }).t = window.setTimeout(() => {
      void refresh(value, group);
    }, 220);
  }

  async function remove(payload: { ids?: string[]; month?: string; year?: string }) {
    const count = payload.ids?.length
      ? payload.ids.length
      : payload.month
        ? stories.filter((s) => monthKey(s.createdAt) === payload.month).length
        : stories.filter((s) => yearKey(s.createdAt) === payload.year).length;
    const extra = isFree
      ? " Free-plan quota for this month is not refunded."
      : "";
    if (
      !window.confirm(
        `Delete ${count} stor${count === 1 ? "y" : "ies"} and the forwarded mail we stored? This cannot be undone.${extra}`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/stories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const groups = useMemo(() => {
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
  }, [stories, group]);

  return (
    <div className="stories-lib">
      <div className="stories-lib__toolbar">
        <input
          className="stories-lib__search"
          placeholder="Search title, subject, people…"
          value={q}
          onChange={(e) => void onSearch(e.target.value)}
        />
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
                void refresh(q, id);
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
      </div>
      {selected.length > 0 ? (
        <div className="stories-lib__bulk">
          <span>{selected.length} selected</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove({ ids: selected })}
          >
            Delete selected
          </button>
        </div>
      ) : null}
      {stories.length === 0 ? (
        <div className="dash-empty">
          <h2>No stories yet</h2>
          <p>Forward a thread from Gmail, Outlook, or Apple Mail to your private address.</p>
          <CopyAddress address={inbound} />
        </div>
      ) : (
        groups.map((section) => (
          <section key={section.key} className="stories-group">
            <header className="stories-group__head">
              <h2>
                {section.label}{" "}
                <span>({section.items.length})</span>
              </h2>
              {group !== "current" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void remove(
                      group === "year"
                        ? { year: section.key }
                        : { month: section.key },
                    )
                  }
                >
                  Delete {group === "year" ? "this year" : "this month"}
                </button>
              ) : null}
            </header>
            {view === "cards" ? (
              <ul className="story-cards">
                {section.items.map((story) => (
                  <li key={story.id} className="story-card">
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
                        {story.subject} · {new Date(story.createdAt).toLocaleDateString()}
                      </p>
                      <p>{story.resolutionSummary}</p>
                    </Link>
                    <button
                      type="button"
                      className="story-card__delete"
                      disabled={busy}
                      onClick={() => void remove({ ids: [story.id] })}
                    >
                      Delete
                    </button>
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
                          onClick={() => void remove({ ids: [story.id] })}
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
    </div>
  );
}
