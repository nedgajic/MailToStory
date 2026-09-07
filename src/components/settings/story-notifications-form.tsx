"use client";

import { useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";

export function StoryNotificationsForm({
  initialEnabled,
  title,
  description,
  hint,
}: {
  initialEnabled: boolean;
  title: string;
  description: string;
  hint?: string;
}) {
  const { showFeedback } = useSettingsFeedback();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: boolean) {
    setBusy(true);
    setError(null);
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
      showFeedback(next ? "Story-ready emails enabled." : "Story-ready emails turned off.");
    } catch {
      setEnabled(previous);
      setError("Could not update notification settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection title="Email notifications">
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
          {hint ? <span className="dash-notify-toggle__hint">{hint}</span> : null}
        </span>
      </label>
      {error ? <p className="auth-form__error">{error}</p> : null}
    </SettingsSection>
  );
}
