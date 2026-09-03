"use client";

import { useEffect, useRef, useState } from "react";
import {
  STORY_DISPLAY_THEMES,
  type StoryDisplayTheme,
} from "@/lib/story-reading-theme";

export function StoryDisplayThemeMenu({
  theme,
  onChange,
}: {
  theme: StoryDisplayTheme;
  onChange: (theme: StoryDisplayTheme) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const current =
    STORY_DISPLAY_THEMES.find((option) => option.id === theme) ??
    STORY_DISPLAY_THEMES[0];

  useEffect(() => {
    if (!menuOpen) return;

    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div
      ref={menuRef}
      className="story-export-actions story-page-toolbar__menu-wrap story-display-theme"
    >
      <button
        type="button"
        className={`story-export-actions__btn story-export-actions__trigger${menuOpen ? " story-export-actions__trigger--open" : ""}`}
        aria-label={`Theme, ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        Theme - {current.label}
        <svg
          className="story-export-actions__chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {menuOpen ? (
        <div
          className="story-page-toolbar__menu story-export-actions__menu story-display-theme__menu"
          role="menu"
          aria-label="Theme options"
        >
          {STORY_DISPLAY_THEMES.map((option) => {
            const selected = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`story-page-toolbar__menu-item story-export-actions__menu-item story-display-theme__item${selected ? " story-display-theme__item--selected" : ""}`}
                onClick={() => {
                  onChange(option.id);
                  setMenuOpen(false);
                }}
              >
                <span className="story-display-theme__item-label">{option.label}</span>
                <span className="story-display-theme__item-hint">{option.hint}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
