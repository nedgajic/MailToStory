"use client";

import { useState } from "react";
import { MarketingShell } from "@/components/landing/marketing-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <MarketingShell showSignIn={false}>
      <div className="auth-card">
        <h1 className="auth-card__title">Reset password</h1>
        {done ? (
          <p>If that email has an account, we sent a reset link.</p>
        ) : (
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/auth/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              setDone(true);
            }}
          >
            <label className="auth-form__field">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="home-cta home-cta--primary" type="submit">
              Send reset link
            </button>
          </form>
        )}
      </div>
    </MarketingShell>
  );
}
