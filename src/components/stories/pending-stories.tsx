"use client";

import { useState } from "react";

export type PendingConversation = {
  id: string;
  subject: string;
  snippet: string;
  lastMessageAt: string;
};

export function PendingStories({ initial }: { initial: PendingConversation[] }) {
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function generate(conversationId: string) {
    setError(null);
    setBusyId(conversationId);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = (await res.json()) as { error?: string; storyId?: string };
      if (!res.ok) {
        setError(data.error || "Could not generate story.");
        return;
      }
      setItems((cur) => cur.filter((item) => item.id !== conversationId));
      if (data.storyId) {
        window.location.href = `/stories/${data.storyId}`;
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
        <h2>Waiting for a story</h2>
      </div>
      <p className="dash-muted">
        These forwarded threads were saved but no story was generated yet — usually
        because of a monthly limit or a temporary error.
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
