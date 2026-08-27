"use client";

import { useState } from "react";

type Member = {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

export function TeamManager({
  seatQuantity,
  members,
  invites,
}: {
  seatQuantity: number;
  members: Member[];
  invites: Invite[];
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const used = members.length;
  const full = used >= seatQuantity;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "member" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not invite.");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function unassign(memberId: string) {
    if (!window.confirm("Unassign this seat? They will lose access to the workspace.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not unassign.");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(inviteId: string) {
    setBusy(true);
    try {
      await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="team-mgr">
      <p>
        <strong>
          {used} / {seatQuantity}
        </strong>{" "}
        seats used
      </p>
      {full ? (
        <p className="dash-muted">
          All seats are taken. Add a seat on the dashboard, then invite someone.
        </p>
      ) : null}
      {error ? <p className="auth-form__error">{error}</p> : null}
      <form className="auth-form" onSubmit={(e) => void invite(e)}>
        <label className="auth-form__field">
          Invite by email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={full}
          />
        </label>
        <button className="home-cta home-cta--primary" type="submit" disabled={busy || full}>
          Assign seat
        </button>
      </form>
      <table className="story-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.name || "—"}</td>
              <td>{m.email}</td>
              <td>{m.role}</td>
              <td>
                {m.role === "owner" ? (
                  "Owner"
                ) : (
                  <button type="button" disabled={busy} onClick={() => void unassign(m.id)}>
                    Unassign
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {invites.length > 0 ? (
        <>
          <h3>Pending invites</h3>
          <ul>
            {invites.map((i) => (
              <li key={i.id}>
                {i.email} · expires {new Date(i.expiresAt).toLocaleDateString()}{" "}
                <button type="button" disabled={busy} onClick={() => void revoke(i.id)}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
