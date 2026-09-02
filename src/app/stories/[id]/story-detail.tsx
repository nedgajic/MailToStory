"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DigestRenderer from "@/components/digest/DigestRenderer";
import { StoryPageToolbar } from "@/components/stories/story-page-toolbar";
import { DeleteStoryConfirmModal } from "@/components/stories/delete-story-confirm-modal";
import { DeletedStoryBanner } from "@/components/stories/deleted-story-banner";
import type { Digest } from "@/lib/digest-schema";
import {
  readStoryReadingTheme,
  writeStoryReadingTheme,
  type StoryReadingTheme,
} from "@/lib/story-reading-theme";

export function StoryDetail({
  storyId,
  conversationId,
  digest,
  messageIdsInOrder,
  isFree,
  deletedAt,
  purgeAt,
}: {
  storyId: string;
  conversationId: string;
  digest: Digest;
  messageIdsInOrder: string[];
  isFree: boolean;
  deletedAt: string | null;
  purgeAt: string | null;
}) {
  const router = useRouter();
  const [readingTheme, setReadingTheme] = useState<StoryReadingTheme>("dark");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setReadingTheme(readStoryReadingTheme());
  }, []);

  function onReadingThemeChange(theme: StoryReadingTheme) {
    setReadingTheme(theme);
    writeStoryReadingTheme(theme);
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await fetch("/api/stories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [storyId] }),
      });
      router.push("/stories?deleted=1");
      router.refresh();
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div
      className={`story-page${readingTheme === "light" ? " story-page--light" : ""}${deletedAt ? " story-page--deleted" : ""}`}
    >
      <StoryPageToolbar
        digest={digest}
        readingTheme={readingTheme}
        onReadingThemeChange={onReadingThemeChange}
        onDelete={() => setDeleteOpen(true)}
        hideDelete={Boolean(deletedAt)}
      />
      {deletedAt && purgeAt ? (
        <DeletedStoryBanner
          storyId={storyId}
          storyTitle={digest.title}
          purgeAt={purgeAt}
        />
      ) : null}
      <DeleteStoryConfirmModal
        open={deleteOpen}
        isFree={isFree}
        busy={deleteBusy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
      <div className="story-page__content">
        <DigestRenderer
          hideAppTopBar
          digest={digest}
          threadId={conversationId}
          messageIdsInOrder={messageIdsInOrder}
        />
      </div>
    </div>
  );
}
