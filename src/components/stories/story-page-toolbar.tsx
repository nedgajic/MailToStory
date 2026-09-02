"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Digest } from "@/lib/digest-schema";
import type { StoryReadingTheme } from "@/lib/story-reading-theme";
import { StoryExportActions } from "@/components/stories/story-export-actions";
import { StoryReadingThemeToggle } from "@/components/stories/story-reading-theme-toggle";

export function StoryPageToolbar({
  digest,
  readingTheme,
  onReadingThemeChange,
  onDelete,
  hideDelete = false,
}: {
  digest: Digest;
  readingTheme: StoryReadingTheme;
  onReadingThemeChange: (theme: StoryReadingTheme) => void;
  onDelete: () => void | Promise<void>;
  hideDelete?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
          <StoryExportActions digest={digest} />

          <StoryReadingThemeToggle
            theme={readingTheme}
            onChange={onReadingThemeChange}
          />

          {hideDelete ? null : (
          <div className="story-page-toolbar__menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="story-page-toolbar__menu-trigger"
              aria-label="More story actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="19" cy="12" r="1.75" />
              </svg>
            </button>

            {menuOpen ? (
              <div className="story-page-toolbar__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="story-page-toolbar__menu-item story-page-toolbar__menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    void onDelete();
                  }}
                >
                  Move to Recently deleted
                </button>
              </div>
            ) : null}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
