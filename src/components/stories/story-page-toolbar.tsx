"use client";

import { useEffect, useRef } from "react";
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
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    let raf = 0;

    const syncStickyOffset = () => {
      const storyPage = toolbar.closest(".story-page");
      if (!storyPage) return;

      const { bottom } = toolbar.getBoundingClientRect();
      // Overlap by 2px so scrolling body content cannot leak between toolbar and tabs.
      const tabsTop = Math.max(0, Math.round(bottom) - 2);
      storyPage.style.setProperty("--story-page-sticky-tabs-top", `${tabsTop}px`);
    };

    const scheduleSync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncStickyOffset);
    };

    syncStickyOffset();
    const observer = new ResizeObserver(scheduleSync);
    observer.observe(toolbar);
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("scroll", scheduleSync, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("scroll", scheduleSync);
    };
  }, []);

  return (
    <div ref={toolbarRef} className="story-page-toolbar">
      <div className="story-page-toolbar__inner">
        <Link href="/stories" className="story-page-toolbar__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Stories
        </Link>

        <div className="story-page-toolbar__cluster">
          <div className="story-page-toolbar__cluster-group">
            <StoryColorModeToggle mode={colorMode} onChange={onColorModeChange} />
            <StoryDisplayThemeMenu
              theme={displayTheme}
              onChange={onDisplayThemeChange}
            />
            <StoryExportActions
              digest={digest}
              displayTheme={displayTheme}
              colorMode={colorMode}
            />
          </div>

          {hideDelete ? null : (
            <>
              <div className="story-page-toolbar__divider" aria-hidden="true" />
              <StoryDeleteIconButton
                label="Delete story"
                className="story-page-toolbar__delete"
                onClick={() => void onDelete()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
