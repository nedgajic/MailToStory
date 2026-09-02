"use client";

import type { StoryReadingTheme } from "@/lib/story-reading-theme";

export function StoryReadingThemeToggle({
  theme,
  onChange,
}: {
  theme: StoryReadingTheme;
  onChange: (theme: StoryReadingTheme) => void;
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label =
    theme === "dark" ? "Switch to day mode" : "Switch to night mode";

  return (
    <button
      type="button"
      className="story-page-toolbar__theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => onChange(nextTheme)}
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
