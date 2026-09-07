"use client";

import { useEffect, useState } from "react";
import type { StoryCardData } from "@/components/stories/stories-library";

export type PendingConversation = {
  id: string;
  subject: string;
  snippet: string;
  lastMessageAt: string;
};

type PendingStoriesProps = {
  initial: PendingConversation[];
  onGenerating?: (conversationId: string) => void;
  onGenerationEnd?: (conversationId: string) => void;
  onStoryGenerated?: (story: StoryCardData & { conversationId: string }) => void;
};

export function PendingStories({
  initial,
  onGenerating,
  onGenerationEnd,
  onStoryGenerated,
}: PendingStoriesProps) {
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  if (items.length === 0) return null;

  async function generate(conversationId: string) {
    setError(null);
    setBusyId(conversationId);
    onGenerating?.(conversationId);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = (await res.json()) as {
        error?: string;
        storyId?: string;
        digest?: { title?: string; resolution_summary?: string; status?: string };
      };
      if (!res.ok) {
        setError(data.error || "Could not generate story.");
        onGenerationEnd?.(conversationId);
        return;
      }
      const source = items.find((item) => item.id === conversationId);
      setItems((cur) => cur.filter((item) => item.id !== conversationId));
      if (data.storyId && data.digest?.title) {
        onStoryGenerated?.({
          id: data.storyId,
          conversationId,
          title: data.digest.title,
          subject: source?.subject ?? "",
          status: data.digest.status ?? "ongoing",
          resolutionSummary: data.digest.resolution_summary ?? "",
          createdAt: new Date().toISOString(),
        });
      } else {
        window.location.reload();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="dash-panel dash-panel--flat stories-pending">
      <div className="dash-panel__head">
        <h2>Needs your attention</h2>
      </div>
      <p className="dash-muted">
        These forwarded threads were saved but no story was generated — usually because
        of a monthly limit or a temporary error. You can retry when you are ready.
      </p>
      {error ? (
        <p className="dash-billing-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="stories-pending__list">
        {items.map((item) => (
          <li key={item.id} className="stories-pending__item">
            <div>
              <p className="stories-pending__subject">{item.subject}</p>
              <p className="stories-pending__meta">
                {item.snippet || "Forwarded thread"} ·{" "}
                {new Date(item.lastMessageAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              className="dash-billing__cta dash-billing__cta--secondary"
              disabled={Boolean(busyId)}
              onClick={() => void generate(item.id)}
            >
              {busyId === item.id ? "Generating…" : "Generate story"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
