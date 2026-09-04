"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { storyLengthLabel } from "@/lib/story-length";
import type { StoryLength } from "@/lib/story-length";
import type { StoryVersionSummary } from "@/lib/story-version-types";

export function RegenerateDuplicateModal({
  open,
  length,
  existingVersion,
  busy = false,
  onCancel,
  onSwitch,
  onRegenerateAnyway,
}: {
  open: boolean;
  length: StoryLength;
  existingVersion: StoryVersionSummary;
  busy?: boolean;
  onCancel: () => void;
  onSwitch: () => void | Promise<void>;
  onRegenerateAnyway: () => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open || !mounted) return null;

  const label = storyLengthLabel(length);
  const created = new Date(existingVersion.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return createPortal(
    <div
      className="story-delete-modal story-delete-modal--choice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerateDuplicateTitle"
    >
      <button
        type="button"
        className="story-delete-modal__backdrop"
        aria-label="Cancel"
        disabled={busy}
        onClick={onCancel}
      />
      <div className="story-delete-modal__panel">
        <h2 id="regenerateDuplicateTitle" className="story-delete-modal__title">
          {label} version already saved
        </h2>
        <p className="story-delete-modal__body">
          Version {existingVersion.versionNumber} ({label}) from {created} is already in
          your library. Switch to it at no credit cost, or regenerate to create a new
          version.
        </p>
        <div className="story-delete-modal__actions story-delete-modal__actions--stack">
          <button
            type="button"
            className="story-delete-modal__confirm story-delete-modal__confirm--primary"
            disabled={busy}
            onClick={() => void onSwitch()}
          >
            {busy ? "Working…" : existingVersion.isActive ? "Keep this version" : `Switch to v${existingVersion.versionNumber}`}
          </button>
          <button
            type="button"
            className="story-delete-modal__cancel"
            disabled={busy}
            onClick={() => void onRegenerateAnyway()}
          >
            Regenerate anyway
          </button>
          <button
            type="button"
            className="story-delete-modal__cancel story-delete-modal__cancel--plain"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
