"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function ChangePasswordForm({
  hasPassword,
  hasGoogleAccount,
}: {
  hasPassword: boolean;
  hasGoogleAccount: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string; reauth?: boolean };
      if (!res.ok) {
        setError(data.error || "Could not update password.");
        return;
      }
      setMessage(data.message || "Password updated.");
      if (data.reauth) {
        await signOut({ callbackUrl: "/login?password=updated" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
      {hasGoogleAccount && !hasPassword ? (
        <p className="dash-muted">
          You sign in with Google. Set a password below if you also want to sign in with
          email and password.
        </p>
      ) : null}
      {hasPassword ? (
        <label className="auth-form__field">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
      ) : null}
      <label className="auth-form__field">
        {hasPassword ? "New password" : "Password"}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      <label className="auth-form__field">
        Confirm {hasPassword ? "new password" : "password"}
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      {hasPassword ? (
        <p className="dash-muted">
          Changing your password signs out other browsers and devices.
        </p>
      ) : null}
      {error ? <p className="auth-form__error">{error}</p> : null}
      {message ? <p className="dash-banner__feedback">{message}</p> : null}
      <button className="home-cta home-cta--primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
}
