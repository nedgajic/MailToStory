"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DigestRenderer from "@/components/digest/DigestRenderer";
import { StoryPageToolbar } from "@/components/stories/story-page-toolbar";
import { DeleteStoryConfirmModal } from "@/components/stories/delete-story-confirm-modal";
import { DeletedStoryBanner } from "@/components/stories/deleted-story-banner";
import type { Digest } from "@/lib/digest-schema";
import { speakerPaletteCssProperties } from "@/lib/participantColors";
import {
  readStoryColorMode,
  readStoryDisplayTheme,
  storyPageThemeClass,
  writeStoryColorMode,
  writeStoryDisplayTheme,
  type StoryColorMode,
  type StoryDisplayTheme,
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
  const [displayTheme, setDisplayTheme] = useState<StoryDisplayTheme>("dossier");
  const [colorMode, setColorMode] = useState<StoryColorMode>("dark");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setDisplayTheme(readStoryDisplayTheme());
    setColorMode(readStoryColorMode());
  }, []);

  function onDisplayThemeChange(theme: StoryDisplayTheme) {
    setDisplayTheme(theme);
    writeStoryDisplayTheme(theme);
  }

  function onColorModeChange(mode: StoryColorMode) {
    setColorMode(mode);
    writeStoryColorMode(mode);
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
      className={`story-page${storyPageThemeClass(displayTheme, colorMode)}${deletedAt ? " story-page--deleted" : ""}`}
      style={speakerPaletteCssProperties(displayTheme, colorMode)}
    >
      <StoryPageToolbar
        digest={digest}
        displayTheme={displayTheme}
        colorMode={colorMode}
        onDisplayThemeChange={onDisplayThemeChange}
        onColorModeChange={onColorModeChange}
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
          displayTheme={displayTheme}
          colorMode={colorMode}
        />
      </div>
    </div>
  );
}
