"use client";

import { useEffect, useState } from "react";

export function GdprConfirmClient({
  token,
  type,
}: {
  token: string;
  type: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!token || type !== "delete") {
      setBusy(false);
      setError("This confirmation link is invalid.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/gdpr/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, type: "delete" }),
        });
        const data = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) {
          setError(data.error || "Could not confirm this request.");
          return;
        }
        setMessage(data.message || "Your request has been completed.");
      } finally {
        setBusy(false);
      }
    })();
  }, [token, type]);

  if (busy) {
    return <p>Confirming your request…</p>;
  }
  if (error) {
    return <p className="auth-form__error">{error}</p>;
  }
  return <p className="auth-form__hint">{message}</p>;
}
