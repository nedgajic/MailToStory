"use client";

import { useState } from "react";

export function ResendVerifyButton() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="dash-banner dash-banner--verify" role="alert">
      <div className="dash-banner__copy">
        <p className="dash-banner__title">Verify your email to activate forwarding</p>
        <p className="dash-banner__text">
          Check your inbox for the verification link. You can request a new one if it
          didn&apos;t arrive.
        </p>
      </div>
      <button
        className="dash-banner__btn"
        type="button"
        onClick={async () => {
          const res = await fetch("/api/auth/resend-verify", { method: "POST" });
          setMsg(res.ok ? "Verification email sent." : "Could not send email.");
        }}
      >
        Resend verification
      </button>
      {msg ? <p className="dash-banner__feedback">{msg}</p> : null}
    </div>
  );
}
