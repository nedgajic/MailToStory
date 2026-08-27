"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true,
  className: "theme-toggle__icon",
};

function IconSun() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 3v1.75M12 19.25V21M3 12h1.75M19.25 12H21M5.64 5.64l1.24 1.24M17.12 17.12l1.24 1.24M5.64 18.36l1.24-1.24M17.12 6.88l1.24-1.24"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg {...iconProps}>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646Z"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="app-top-bar__theme-toggle"
      onClick={toggleTheme}
      aria-label={
        mounted
          ? isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Theme"
      }
      aria-pressed={mounted ? isDark : undefined}
      suppressHydrationWarning
    >
      {!mounted ? <IconMoon /> : isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
