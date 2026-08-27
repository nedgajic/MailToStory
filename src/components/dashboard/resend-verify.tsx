"use client";

import { useState } from "react";

export function ResendVerifyButton() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="dash-banner">
      <p>
        Verify your email to activate forwarding. Check your inbox, or resend the
        link.
      </p>
      <button
        className="home-cta"
        type="button"
        onClick={async () => {
          const res = await fetch("/api/auth/resend-verify", { method: "POST" });
          setMsg(res.ok ? "Verification email sent." : "Could not send email.");
        }}
      >
        Resend verification
      </button>
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
