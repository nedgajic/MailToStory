"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppToast } from "@/components/ui/app-toast";
import { PermanentDeleteStoryModal } from "@/components/stories/permanent-delete-story-modal";
import { StoryDeleteIconButton } from "@/components/stories/story-delete-icon-button";
import { formatPurgeDetail } from "@/lib/story-purge-label";

export function DeletedStoryBanner({
  storyId,
  storyTitle,
  purgeAt,
}: {
  storyId: string;
  storyTitle: string;
  purgeAt: string;
}) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const [busy, setBusy] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);

  async function restore() {
    setBusy(true);
    try {
      await fetch("/api/stories/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [storyId] }),
      });
      showToast({ message: `"${storyTitle}" restored to your library.` });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function confirmPermanentDelete() {
    setBusy(true);
    try {
      await fetch("/api/stories/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [storyId] }),
      });
      showToast({ message: `"${storyTitle}" permanently deleted.` });
      router.push("/stories?view=deleted");
      router.refresh();
    } finally {
      setBusy(false);
      setPurgeOpen(false);
    }
  }

  return (
    <>
      <div className="story-deleted-banner" role="status">
        <div className="story-deleted-banner__copy">
          <p className="story-deleted-banner__title">This story is in Recently deleted</p>
          <p className="story-deleted-banner__meta">{formatPurgeDetail(purgeAt)}</p>
        </div>
        <div className="story-deleted-banner__actions">
          <Link href="/stories?view=deleted" className="story-deleted-banner__link">
            View all
          </Link>
          <StoryDeleteIconButton
            label="Permanently delete story"
            className="story-deleted-banner__purge"
            disabled={busy}
            onClick={() => setPurgeOpen(true)}
          />
          <button
            type="button"
            className="story-deleted-banner__restore"
            disabled={busy}
            onClick={() => void restore()}
          >
            {busy ? "Working…" : "Restore story"}
          </button>
        </div>
      </div>
      <PermanentDeleteStoryModal
        open={purgeOpen}
        busy={busy}
        onCancel={() => setPurgeOpen(false)}
        onConfirm={confirmPermanentDelete}
      />
    </>
  );
}
