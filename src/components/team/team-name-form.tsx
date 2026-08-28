"use client";

import { useState } from "react";
import { CopyAddress } from "@/components/copy-address";

export function TeamNameForm({
  initialName,
  inbound,
  plan,
}: {
  initialName: string;
  inbound: string;
  plan: string;
}) {
  const [teamName, setTeamName] = useState(initialName);
  const [inboundAddr, setInboundAddr] = useState(inbound);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  if (plan !== "team") {
    return (
      <p className="dash-muted">
        Upgrade to the Team plan to set a shared team name and inbox address.
      </p>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName }),
      });
      const data = (await res.json()) as {
        error?: string;
        inbound?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not save team name.");
        return;
      }
      if (data.inbound) setInboundAddr(data.inbound);
      setSaved("Team name and inbox address updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dash-panel team-name-form">
      <div className="dash-panel__head">
        <h2>Team name & inbox</h2>
      </div>
      <p className="dash-muted">
        Your team name becomes the shared forwarding address everyone uses.
      </p>
      <form className="auth-form" onSubmit={(e) => void save(e)}>
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
        {saved ? <p className="dash-banner__feedback">{saved}</p> : null}
        <button className="home-cta home-cta--primary" type="submit" disabled={busy}>
          Save team name
        </button>
      </form>
      <div className="team-name-form__inbound">
        <p className="dash-inbound__eyebrow">Shared inbox</p>
        <CopyAddress address={inboundAddr} prominent />
      </div>
    </section>
  );
}
