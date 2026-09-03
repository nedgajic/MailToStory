"use client";

import Link from "next/link";
import type { Digest } from "@/lib/digest-schema";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import { StoryExportActions } from "@/components/stories/story-export-actions";
import { StoryDisplayThemeMenu } from "@/components/stories/story-display-theme-menu";
import { StoryColorModeToggle } from "@/components/stories/story-color-mode-toggle";
import { StoryDeleteIconButton } from "@/components/stories/story-delete-icon-button";

export function StoryPageToolbar({
  digest,
  displayTheme,
  colorMode,
  onDisplayThemeChange,
  onColorModeChange,
  onDelete,
  hideDelete = false,
}: {
  digest: Digest;
  displayTheme: StoryDisplayTheme;
  colorMode: StoryColorMode;
  onDisplayThemeChange: (theme: StoryDisplayTheme) => void;
  onColorModeChange: (mode: StoryColorMode) => void;
  onDelete: () => void | Promise<void>;
  hideDelete?: boolean;
}) {
  return (
    <div className="story-page-toolbar">
      <div className="story-page-toolbar__inner">
        <Link href="/stories" className="story-page-toolbar__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Stories
        </Link>

        <div className="story-page-toolbar__cluster">
          <div className="story-page-toolbar__cluster-group story-page-toolbar__cluster-group--export">
            <StoryExportActions
              digest={digest}
              displayTheme={displayTheme}
              colorMode={colorMode}
            />
            <StoryDisplayThemeMenu
              theme={displayTheme}
              onChange={onDisplayThemeChange}
            />
          </div>

          <div className="story-page-toolbar__cluster-group">
            <StoryColorModeToggle mode={colorMode} onChange={onColorModeChange} />

            {hideDelete ? null : (
              <StoryDeleteIconButton
                label="Delete story"
                className="story-page-toolbar__delete"
                onClick={() => void onDelete()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
