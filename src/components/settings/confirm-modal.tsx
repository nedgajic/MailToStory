"use client";

import { useEffect } from "react";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="settings-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settingsConfirmModalTitle"
    >
      <button
        type="button"
        className="settings-confirm-modal__backdrop"
        aria-label="Close"
        disabled={busy}
        onClick={onCancel}
      />
      <div className="settings-confirm-modal__panel">
        <div className="settings-confirm-modal__header">
          <h2 id="settingsConfirmModalTitle" className="settings-confirm-modal__title">
            {title}
          </h2>
        </div>
        <div className="settings-confirm-modal__body">
          <p className="settings-confirm-modal__description">{description}</p>
          <div className="settings-form__footer settings-confirm-modal__actions">
            <button
              type="button"
              className="settings-btn settings-btn--secondary"
              disabled={busy}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`settings-btn settings-btn--${confirmTone === "danger" ? "danger" : "primary"}`}
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
