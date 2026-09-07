"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const { update } = useSession();
  const { showFeedback } = useSettingsFeedback();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { error?: string; name?: string };
      if (!res.ok) {
        setError(data.error || "Could not update name.");
        return;
      }
      if (data.name) setName(data.name);
      await update({ name: data.name ?? name });
      showFeedback("Name updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form auth-form--settings" onSubmit={(e) => void onSubmit(e)}>
      <label className="auth-form__field">
        <span className="sr-only">Display name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={120}
          placeholder="Your name"
          required
        />
      </label>
      {error ? <p className="auth-form__error">{error}</p> : null}
      <div className="settings-form__footer">
        <button className="settings-btn settings-btn--primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save name"}
        </button>
      </div>
    </form>
  );
}
