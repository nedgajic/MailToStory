"use client";

import { useState } from "react";

type RequestType = "export" | "deletion";

export function DataRequestForm() {
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("export");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const endpoint =
        requestType === "export"
          ? "/api/gdpr/request-export"
          : "/api/gdpr/request-deletion";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        data?: unknown;
        signInRequired?: boolean;
      };
      if (!res.ok) {
        setError(data.error || "Request failed.");
        return;
      }
      if (data.signInRequired) {
        setMessage(data.message || "Sign in to manage your account data.");
        return;
      }
      if (requestType === "export" && data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mailtostory-data-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("Your data export has been downloaded.");
        return;
      }
      setMessage(
        data.message ||
          "Your request has been processed. If we had your data, it has been handled.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
      <label className="auth-form__field">
        Email address
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <fieldset className="auth-form__field">
        <legend>Request type</legend>
        <label>
          <input
            type="radio"
            name="requestType"
            value="export"
            checked={requestType === "export"}
            onChange={() => setRequestType("export")}
          />{" "}
          Export my data
        </label>
        <label>
          <input
            type="radio"
            name="requestType"
            value="deletion"
            checked={requestType === "deletion"}
            onChange={() => setRequestType("deletion")}
          />{" "}
          Delete my data
        </label>
      </fieldset>
      {error ? <p className="auth-form__error">{error}</p> : null}
      {message ? <p className="auth-form__hint">{message}</p> : null}
      <button className="home-cta home-cta--primary" type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
