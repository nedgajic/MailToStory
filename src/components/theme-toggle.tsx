"use client";

import { useTheme } from "@/components/theme-provider";

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v1.09a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 19a1 1 0 0 1-1-1v-1.09a1 1 0 1 1 2 0V21a1 1 0 0 1-1 1ZM3 12a1 1 0 0 1 1-1h1.09a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm16.91 0a1 1 0 0 1 1-1H22a1 1 0 0 1 0 2h-1.09a1 1 0 0 1-1-1ZM5.64 5.64a1 1 0 0 1 1.41 0l.77.77a1 1 0 1 1-1.41 1.41l-.77-.77a1 1 0 0 1 0-1.41Zm11.18 11.18a1 1 0 0 1 1.41 0l.77.77a1 1 0 0 1-1.41 1.41l-.77-.77a1 1 0 0 1 0-1.41ZM18.36 5.64a1 1 0 0 1 0 1.41l-.77.77a1 1 0 1 1-1.41-1.41l.77-.77a1 1 0 0 1 1.41 0ZM6.05 17.23a1 1 0 0 1 0 1.41l-.77.77a1 1 0 0 1-1.41-1.41l.77-.77a1 1 0 0 1 1.41 0Z"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="app-top-bar__theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
