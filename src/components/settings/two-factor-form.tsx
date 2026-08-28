"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

type SetupState = {
  qrCodeDataUrl: string;
  manualKey: string;
};

export function TwoFactorForm({
  enabled,
  hasPassword,
}: {
  enabled: boolean;
  hasPassword: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });
      const data = (await res.json()) as {
        error?: string;
        qrCodeDataUrl?: string;
        manualKey?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not start two-factor setup.");
        return;
      }
      if (!data.qrCodeDataUrl || !data.manualKey) {
        setError("Setup response was incomplete.");
        return;
      }
      setSetup({ qrCodeDataUrl: data.qrCodeDataUrl, manualKey: data.manualKey });
      setMessage("Scan the QR code, then enter the 6-digit code to finish.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string; backupCodes?: string[] };
      if (!res.ok) {
        setError(data.error || "Could not confirm two-factor authentication.");
        return;
      }
      setSetup(null);
      setCode("");
      setCurrentPassword("");
      setBackupCodes(data.backupCodes ?? []);
      setMessage("Two-factor authentication is now enabled.");
    } finally {
      setBusy(false);
    }
  }

  async function disableTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, code }),
      });
      const data = (await res.json()) as { error?: string; message?: string; reauth?: boolean };
      if (!res.ok) {
        setError(data.error || "Could not disable two-factor authentication.");
        return;
      }
      setMessage(data.message || "Two-factor authentication disabled.");
      if (data.reauth) {
        await signOut({ callbackUrl: "/login" });
      } else {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!hasPassword) {
    return (
      <p className="dash-muted">
        Set a password first if you want to protect email sign-in with an authenticator app.
        Google sign-in is not affected.
      </p>
    );
  }

  if (backupCodes && backupCodes.length > 0) {
    return (
      <div className="dash-panel__stack">
        <p className="dash-banner__feedback">
          Save these backup codes somewhere safe. Each code works once if you lose your phone.
        </p>
        <ul className="two-factor-backup-codes">
          {backupCodes.map((item) => (
            <li key={item}>
              <code>{item}</code>
            </li>
          ))}
        </ul>
        <button
          className="home-cta home-cta--primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          Done
        </button>
      </div>
    );
  }

  if (enabled) {
    return (
      <form className="auth-form" onSubmit={(e) => void disableTwoFactor(e)}>
        <p className="dash-muted">
          Two-factor authentication is enabled for email sign-in. You will need your
          authenticator app or a backup code when signing in with password.
        </p>
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
        <label className="auth-form__field">
          Authenticator or backup code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="one-time-code"
            required
          />
        </label>
        {error ? <p className="auth-form__error">{error}</p> : null}
        {message ? <p className="dash-banner__feedback">{message}</p> : null}
        <button className="home-cta home-cta--secondary" type="submit" disabled={busy}>
          {busy ? "Disabling…" : "Disable two-factor authentication"}
        </button>
      </form>
    );
  }

  if (setup) {
    return (
      <form className="auth-form" onSubmit={(e) => void confirmSetup(e)}>
        <img
          src={setup.qrCodeDataUrl}
          alt="QR code for authenticator app"
          className="two-factor-qr"
        />
        <p className="dash-muted">
          Or enter this key manually: <code>{setup.manualKey}</code>
        </p>
        <label className="auth-form__field">
          6-digit code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            required
          />
        </label>
        {error ? <p className="auth-form__error">{error}</p> : null}
        {message ? <p className="dash-banner__feedback">{message}</p> : null}
        <button className="home-cta home-cta--primary" type="submit" disabled={busy}>
          {busy ? "Confirming…" : "Enable two-factor authentication"}
        </button>
      </form>
    );
  }

  return (
    <div className="dash-panel__stack">
      <p className="dash-muted">
        Add an authenticator app (Google Authenticator, 1Password, Authy, etc.) for extra
        protection when signing in with email and password.
      </p>
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
      {error ? <p className="auth-form__error">{error}</p> : null}
      {message ? <p className="dash-banner__feedback">{message}</p> : null}
      <button
        className="home-cta home-cta--primary"
        type="button"
        disabled={busy}
        onClick={() => void startSetup()}
      >
        {busy ? "Preparing…" : "Set up two-factor authentication"}
      </button>
    </div>
  );
}
