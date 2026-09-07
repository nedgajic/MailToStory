"use client";

import { useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";

type MemberOption = {
  id: string;
  name: string | null;
  email: string | null;
};

export function TransferOwnershipForm({
  members,
}: {
  members: MemberOption[];
}) {
  const { showFeedback } = useSettingsFeedback();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (members.length === 0) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected = members.find((member) => member.id === memberId);
    const label = selected?.name || selected?.email || "this member";
    if (
      !window.confirm(
        `Transfer workspace ownership to ${label}? You will become an admin and can leave or delete your account afterward.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team/transfer-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not transfer ownership.");
        return;
      }
      showFeedback("Ownership transferred.");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection title="Transfer ownership">
      <p className="dash-muted">
        Before deleting your account, transfer ownership to another active team member.
        You will become an admin.
      </p>
      <form className="auth-form auth-form--settings" onSubmit={(e) => void onSubmit(e)}>
        <label className="auth-form__field">
          New owner
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name?.trim() || member.email || "Team member"}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="auth-form__error">{error}</p> : null}
        <div className="settings-form__footer">
          <button className="settings-btn settings-btn--secondary" type="submit" disabled={busy}>
            {busy ? "Transferring…" : "Transfer ownership"}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
