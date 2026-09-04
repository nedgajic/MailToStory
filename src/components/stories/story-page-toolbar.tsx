"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Digest } from "@/lib/digest-schema";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import { StoryExportActions } from "@/components/stories/story-export-actions";
import { StoryDisplayThemeMenu } from "@/components/stories/story-display-theme-menu";
import { StoryColorModeToggle } from "@/components/stories/story-color-mode-toggle";
import { StoryDeleteIconButton } from "@/components/stories/story-delete-icon-button";
import { StoryRegenerateMenu } from "@/components/stories/story-regenerate-menu";
import { StoryVersionPicker } from "@/components/stories/story-version-picker";
import type { StoryVersionSummary } from "@/lib/story-version-types";
import type { StoryLength } from "@/lib/story-length";

export function StoryPageToolbar({
  digest,
  storyId,
  conversationId,
  storyLength,
  versions,
  activeVersionId,
  canUseElaborate,
  creditsRemainingLabel,
  displayTheme,
  colorMode,
  onDisplayThemeChange,
  onColorModeChange,
  onRegenerated,
  onVersionActivated,
  onDelete,
  hideDelete = false,
  hideRegenerate = false,
  disableBack = false,
  disableExport = false,
  disableDelete = false,
}: {
  digest: Digest;
  storyId: string;
  conversationId: string;
  storyLength: StoryLength;
  versions: StoryVersionSummary[];
  activeVersionId: string | null;
  canUseElaborate: boolean;
  creditsRemainingLabel: string | null;
  displayTheme: StoryDisplayTheme;
  colorMode: StoryColorMode;
  onDisplayThemeChange: (theme: StoryDisplayTheme) => void;
  onColorModeChange: (mode: StoryColorMode) => void;
  onRegenerated: (payload: {
    digest: Digest;
    messageIdsInOrder: string[];
    storyLength: StoryLength;
    activeVersionId?: string | null;
    versions?: StoryVersionSummary[];
  }) => void;
  onVersionActivated: (payload: {
    digest: Digest;
    messageIdsInOrder: string[];
    storyLength: StoryLength;
    activeVersionId: string;
    versions: StoryVersionSummary[];
  }) => void;
  onDelete: () => void | Promise<void>;
  hideDelete?: boolean;
  hideRegenerate?: boolean;
  disableBack?: boolean;
  disableExport?: boolean;
  disableDelete?: boolean;
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
    <div ref={toolbarRef} className="story-page-toolbar story-page-toolbar--compact">
      <div className="story-page-toolbar__inner">
        {disableBack ? (
          <span
            className="story-page-toolbar__back story-page-toolbar__back--disabled"
            aria-disabled="true"
            title="Demo preview"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="story-page-toolbar__back-label">Stories</span>
          </span>
        ) : (
          <Link href="/stories" className="story-page-toolbar__back" title="Back to stories">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="story-page-toolbar__back-label">Stories</span>
          </Link>
        )}

        <div className="story-page-toolbar__cluster">
          <div className="story-page-toolbar__dock" role="toolbar" aria-label="Story actions">
            {!hideRegenerate ? (
              <>
                <div className="story-page-toolbar__dock-group">
                  <StoryVersionPicker
                    storyId={storyId}
                    versions={versions}
                    activeVersionId={activeVersionId}
                    compact
                    onActivated={onVersionActivated}
                  />
                  <StoryRegenerateMenu
                    storyId={storyId}
                    conversationId={conversationId}
                    storyLength={storyLength}
                    versions={versions}
                    canUseElaborate={canUseElaborate}
                    creditsRemainingLabel={creditsRemainingLabel}
                    compact
                    onRegenerated={onRegenerated}
                    onVersionActivated={onVersionActivated}
                  />
                </div>
                <div className="story-page-toolbar__dock-separator" aria-hidden />
              </>
            ) : null}

            <div className="story-page-toolbar__dock-group">
              <StoryColorModeToggle mode={colorMode} onChange={onColorModeChange} />
              <StoryDisplayThemeMenu
                theme={displayTheme}
                compact
                onChange={onDisplayThemeChange}
              />
            </div>

            <div className="story-page-toolbar__dock-separator" aria-hidden />

            <div className="story-page-toolbar__dock-group">
              <StoryExportActions
                digest={digest}
                displayTheme={displayTheme}
                colorMode={colorMode}
                compact
                disabled={disableExport}
              />
            </div>

            {hideDelete ? null : (
              <>
                <div
                  className="story-page-toolbar__dock-separator story-page-toolbar__dock-separator--danger"
                  aria-hidden
                />
                <div className="story-page-toolbar__dock-group">
                  <StoryDeleteIconButton
                    label={disableDelete ? "Delete available after sign up" : "Delete story"}
                    disabled={disableDelete}
                    className="story-page-toolbar__icon-btn story-page-toolbar__icon-btn--danger"
                    onClick={() => void onDelete()}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
