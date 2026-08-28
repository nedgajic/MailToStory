"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/billing/plans";

export function StoryNotificationsForm({
  initialEnabled,
  plan,
  title,
  description,
  hint,
}: {
  initialEnabled: boolean;
  plan: PlanId;
  title: string;
  description: string;
  hint: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save(next: boolean) {
    setBusy(true);
    setError(null);
    setSaved(null);
    const previous = enabled;
    setEnabled(next);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyStoryReady: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEnabled(previous);
        setError(data.error || "Could not update notification settings.");
        return;
      }
      setSaved(next ? "Story-ready emails enabled." : "Story-ready emails turned off.");
    } catch {
      setEnabled(previous);
      setError("Could not update notification settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dash-panel">
      <h2 className="dash-panel__section-title">Email notifications</h2>
      <p className="dash-muted">{description}</p>
      <label className="dash-notify-toggle">
        <input
          type="checkbox"
          checked={enabled}
          disabled={busy}
          onChange={(e) => void save(e.target.checked)}
        />
        <span className="dash-notify-toggle__copy">
          <span className="dash-notify-toggle__title">{title}</span>
          <span className="dash-notify-toggle__hint">{hint}</span>
        </span>
      </label>
      {plan !== "team" ? (
        <p className="dash-muted dash-notify-toggle__note">
          Solo plans only notify the account email that forwarded the thread.
        </p>
      ) : null}
      {error ? <p className="auth-form__error">{error}</p> : null}
      {saved ? <p className="dash-banner__feedback">{saved}</p> : null}
    </section>
  );
}
