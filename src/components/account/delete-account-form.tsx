"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function DeleteAccountForm({
  email,
  hasPassword,
}: {
  email: string | null;
  hasPassword: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not delete account.");
        return;
      }
      await signOut({ callbackUrl: "/?deleted=1" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
      <p>
        This cancels any paid subscription immediately, deletes forwarded mail and
        stories in workspaces you own, and signs you out. Type{" "}
        <strong>{email || "DELETE"}</strong> to confirm.
      </p>
      <label className="auth-form__field">
        Confirmation
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </label>
      {hasPassword ? (
        <label className="auth-form__field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      ) : null}
      {error ? <p className="auth-form__error">{error}</p> : null}
      <button className="home-cta dash-danger" type="submit" disabled={busy}>
        {busy ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
