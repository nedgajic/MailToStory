export type StoryReadingTheme = "dark" | "light";

const STORAGE_KEY = "mailtostory:story-reading-theme";

export function readStoryReadingTheme(): StoryReadingTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function writeStoryReadingTheme(theme: StoryReadingTheme): void {
  window.localStorage.setItem(STORAGE_KEY, theme);
}
