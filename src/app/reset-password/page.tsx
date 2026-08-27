"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MarketingShell } from "@/components/landing/marketing-shell";
import Link from "next/link";

function ResetInner() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="auth-card">
      <h1 className="auth-card__title">Choose a new password</h1>
      {done ? (
        <p>
          Password updated. <Link href="/login">Sign in</Link>
        </p>
      ) : (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/auth/reset", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, password }),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
              setError(data.error || "Could not reset password.");
              return;
            }
            setDone(true);
          }}
        >
          <label className="auth-form__field">
            New password
            <input
              type="password"
              minLength={10}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <button className="home-cta home-cta--primary" type="submit">
            Update password
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <MarketingShell showSignIn={false}>
      <Suspense>
        <ResetInner />
      </Suspense>
    </MarketingShell>
  );
}
