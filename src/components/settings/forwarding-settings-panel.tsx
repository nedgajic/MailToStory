"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";
import { notifyStoriesSummaryChanged } from "@/lib/stories-summary-events";

type ForwardingAddress = {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
};

type QuarantineItem = {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  attachmentCount?: number;
  expiresAt: string;
  createdAt: string;
};

export function ForwardingSettingsPanel({
  canManage,
}: {
  canManage: boolean;
}) {
  const { showFeedback } = useSettingsFeedback();
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [forwardingAddresses, setForwardingAddresses] = useState<
    ForwardingAddress[]
  >([]);
  const [quarantine, setQuarantine] = useState<QuarantineItem[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings/forwarding-addresses");
    if (!res.ok) return;
    const data = (await res.json()) as {
      memberEmails: string[];
      forwardingAddresses: ForwardingAddress[];
    };
    setMemberEmails(data.memberEmails);
    setForwardingAddresses(data.forwardingAddresses);

    const qRes = await fetch("/api/settings/quarantine");
    if (qRes.ok) {
      const qData = (await qRes.json()) as { items: QuarantineItem[] };
      setQuarantine(qData.items);
    } else {
      setQuarantine([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/forwarding-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Could not add address.");
        return;
      }
      setNewEmail("");
      showFeedback(data.message || "Confirmation link sent.");
      await load();
    } catch {
      setError("Could not add address.");
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation(row: ForwardingAddress) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/forwarding-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", id: row.id }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Could not resend confirmation.");
        return;
      }
      showFeedback(data.message || "Confirmation link resent.");
    } catch {
      setError("Could not resend confirmation.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAddress(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/forwarding-addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not remove address.");
        return;
      }
      showFeedback("Forwarding address removed.");
      await load();
    } catch {
      setError("Could not remove address.");
    } finally {
      setBusy(false);
    }
  }

  async function approveSender(fromEmail: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/quarantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", fromEmail }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Could not approve sender.");
        return;
      }
      showFeedback(data.message || "Verification email sent.");
      await load();
      notifyStoriesSummaryChanged();
    } catch {
      setError("Could not approve sender.");
    } finally {
      setBusy(false);
    }
  }

  async function rejectSender(fromEmail: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/quarantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", fromEmail }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Could not dismiss held mail.");
        return;
      }
      await load();
      notifyStoriesSummaryChanged();
    } catch {
      setError("Could not dismiss held mail.");
    } finally {
      setBusy(false);
    }
  }

  const quarantineBySender = quarantine.reduce<Record<string, QuarantineItem[]>>(
    (acc, item) => {
      const key = item.fromEmail;
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  return (
    <SettingsSection title="Forwarding addresses" id="forwarding">
      <p className="dash-muted">
        Only mail sent from verified addresses can become stories. Your account
        email is allowed automatically after verification. Add other addresses
        you forward from (work alias, personal Gmail, etc.).
      </p>

      <div className="dash-forwarding__group">
        <h3 className="dash-forwarding__label">Account emails (automatic)</h3>
        {memberEmails.length > 0 ? (
          <ul className="dash-forwarding__list">
            {memberEmails.map((email) => (
              <li key={email} className="dash-forwarding__item">
                <span>{email}</span>
                <span className="dash-forwarding__badge">Verified member</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash-muted">Verify your account email to enable forwarding.</p>
        )}
      </div>

      <div className="dash-forwarding__group">
        <h3 className="dash-forwarding__label">Additional addresses</h3>
        {forwardingAddresses.length > 0 ? (
          <ul className="dash-forwarding__list">
            {forwardingAddresses.map((row) => (
              <li key={row.id} className="dash-forwarding__item">
                <span>{row.email}</span>
                <span className="dash-forwarding__badge">
                  {row.verified ? "Verified" : "Pending confirmation"}
                </span>
                {canManage && !row.verified ? (
                  <button
                    type="button"
                    className="settings-btn settings-btn--ghost dash-forwarding__link-btn"
                    disabled={busy}
                    onClick={() => void resendConfirmation(row)}
                  >
                    Resend link
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    className="settings-btn settings-btn--ghost settings-btn--danger dash-forwarding__remove"
                    disabled={busy}
                    onClick={() => void removeAddress(row.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash-muted">No extra forwarding addresses yet.</p>
        )}

        {canManage ? (
          <form
            className="auth-form auth-form--settings dash-forwarding__add"
            onSubmit={(e) => void addAddress(e)}
          >
            <label className="auth-form__field">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={busy}
                required
              />
            </label>
            <div className="settings-form__footer">
              <button
                type="submit"
                className="settings-btn settings-btn--primary"
                disabled={busy}
              >
                Add &amp; send confirmation
              </button>
            </div>
          </form>
        ) : (
          <p className="dash-muted">
            Ask a workspace admin to add forwarding addresses.
          </p>
        )}
      </div>

      {quarantine.length > 0 ? (
        <div className="dash-forwarding__group dash-forwarding__quarantine">
          <h3 className="dash-forwarding__label">Held mail — approval needed</h3>
          <p className="dash-muted">
            These messages were not stored in your inbox. Approve the sender to
            receive a confirmation link at that address; held mail processes after
            verification. Attachments are not kept while mail is held.
          </p>
          {Object.entries(quarantineBySender).map(([fromEmail, items]) => (
            <div key={fromEmail} className="dash-forwarding__held">
              <div className="dash-forwarding__held-head">
                <strong>{fromEmail}</strong>
                <span>{items.length} message{items.length === 1 ? "" : "s"}</span>
              </div>
              <ul className="dash-forwarding__held-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <span className="dash-forwarding__held-subject">{item.subject}</span>
                    <span className="dash-forwarding__held-snippet">{item.snippet}</span>
                    {item.attachmentCount ? (
                      <span className="dash-forwarding__held-note">
                        {item.attachmentCount} attachment{item.attachmentCount === 1 ? "" : "s"} not stored
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="dash-forwarding__held-actions">
                <button
                  type="button"
                  className="settings-btn settings-btn--primary"
                  disabled={busy}
                  onClick={() => void approveSender(fromEmail)}
                >
                  Approve sender
                </button>
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost settings-btn--danger"
                  disabled={busy}
                  onClick={() => void rejectSender(fromEmail)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="auth-form__error">{error}</p> : null}
    </SettingsSection>
  );
}
