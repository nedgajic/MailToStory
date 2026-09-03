"use client";

import { useEffect } from "react";

export function DeleteStoryConfirmModal({
  open,
  count = 1,
  isFree = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  count?: number;
  isFree?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const title = count === 1 ? "Delete story?" : `Delete ${count} stories?`;
  const body =
    count === 1
      ? "The story and forwarded email will be removed from your library. You can restore them within 30 days from Recently deleted."
      : `These ${count} stories and their forwarded email will be removed from your library. You can restore them within 30 days from Recently deleted.`;
  const confirmLabel = count === 1 ? "Delete" : `Delete ${count}`;

  return (
    <div
      className="story-delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storyDeleteModalTitle"
    >
      <button
        type="button"
        className="story-delete-modal__backdrop"
        aria-label="Cancel"
        disabled={busy}
        onClick={onCancel}
      />
      <div className="story-delete-modal__panel">
        <h2 id="storyDeleteModalTitle" className="story-delete-modal__title">
          {title}
        </h2>
        <p className="story-delete-modal__body">{body}</p>
        <p className="story-delete-modal__note">
          After 30 days, stories in Recently deleted are permanently removed.
        </p>
        {isFree ? (
          <p className="story-delete-modal__free-note">
            Free-plan quota for this month is not refunded.
          </p>
        ) : null}
        <div className="story-delete-modal__actions">
          <button
            type="button"
            className="story-delete-modal__cancel"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="story-delete-modal__confirm"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
