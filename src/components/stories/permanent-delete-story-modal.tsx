"use client";

import { useEffect } from "react";
import { deletedStoryRetentionDays } from "@/lib/story-retention";

export function PermanentDeleteStoryModal({
  open,
  count = 1,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  count?: number;
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

  const retentionDays = deletedStoryRetentionDays();
  const title =
    count === 1 ? "Delete permanently?" : `Delete ${count} stories permanently?`;
  const body =
    count === 1
      ? "The story and forwarded email will be removed immediately. You will not be able to restore them."
      : `These ${count} stories and their forwarded email will be removed immediately. You will not be able to restore them.`;
  const confirmLabel =
    count === 1 ? "Delete permanently" : `Delete ${count} permanently`;

  return (
    <div
      className="story-delete-modal story-delete-modal--permanent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storyPermanentDeleteModalTitle"
    >
      <button
        type="button"
        className="story-delete-modal__backdrop"
        aria-label="Cancel"
        disabled={busy}
        onClick={onCancel}
      />
      <div className="story-delete-modal__panel">
        <h2 id="storyPermanentDeleteModalTitle" className="story-delete-modal__title">
          {title}
        </h2>
        <p className="story-delete-modal__body">{body}</p>
        <p className="story-delete-modal__note">This cannot be undone.</p>
        <p className="story-delete-modal__free-note">
          Stories in Recently deleted are normally removed automatically after{" "}
          {retentionDays} days.
        </p>
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
