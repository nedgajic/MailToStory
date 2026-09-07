"use client";

import { useState } from "react";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";

export function ExportAccountForm() {
  const { showFeedback } = useSettingsFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Export failed.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `mailtostory-export-${Date.now()}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback("Your data export has been downloaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p>
        Download a JSON copy of your profile, workspace settings, forwarded mail,
        stories, and attachment metadata.
      </p>
      {error ? <p className="auth-form__error">{error}</p> : null}
      <div className="settings-form__footer">
        <button
          type="button"
          className="settings-btn settings-btn--secondary"
          disabled={busy}
          onClick={() => void onExport()}
        >
          {busy ? "Preparing export…" : "Export my data"}
        </button>
      </div>
    </div>
  );
}
