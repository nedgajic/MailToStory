"use client";

import { useState } from "react";
import { CopyAddress } from "@/components/copy-address";
import { SettingsSection } from "@/components/settings/settings-section";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";

export function TeamNameForm({
  initialName,
  inbound,
  plan,
}: {
  initialName: string;
  inbound: string;
  plan: string;
}) {
  const { showFeedback } = useSettingsFeedback();
  const [teamName, setTeamName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (plan !== "team") {
    return (
      <SettingsSection title="Team name & inbox">
        <p className="dash-muted">
          Upgrade to the Team plan to set a shared team name and inbox address.
        </p>
      </SettingsSection>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save team name.");
        return;
      }
      showFeedback("Team name updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection title="Team name & inbox" className="team-name-form">
      <div className="team-name-form__inbound">
        <p className="dash-inbound__eyebrow">Shared inbox</p>
        <CopyAddress address={inbound} prominent />
        <p className="dash-muted team-name-form__inbound-note">
          Your shared inbox address stays the same when you rename your team.
        </p>
      </div>
      <form className="auth-form auth-form--settings" onSubmit={(e) => void save(e)}>
        <label className="auth-form__field">
          Team name
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Northwind Legal"
          />
        </label>
        {error ? <p className="auth-form__error">{error}</p> : null}
        <div className="settings-form__footer">
          <button className="settings-btn settings-btn--primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save team name"}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
