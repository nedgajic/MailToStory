"use client";

import * as React from "react";
import {
  applyThemeToDocument,
  readThemeFromDocument,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

export type { Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  mounted: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export { applyThemeToDocument } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  const persistTheme = React.useCallback((next: Theme) => {
    applyThemeToDocument(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next);
      persistTheme(next);
    },
    [persistTheme],
  );

  React.useLayoutEffect(() => {
    setThemeState(readThemeFromDocument());
    setMounted(true);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      const next = current === "light" ? "dark" : "light";
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    [theme, mounted, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
