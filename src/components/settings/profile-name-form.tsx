"use client";

import { useState } from "react";

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(null);
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
      setSaved("Name updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
      <label className="auth-form__field">
        Display name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={120}
          required
        />
      </label>
      {error ? <p className="auth-form__error">{error}</p> : null}
      {saved ? <p className="dash-banner__feedback">{saved}</p> : null}
      <button className="home-cta home-cta--primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
