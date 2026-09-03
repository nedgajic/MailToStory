export type StoryDisplayTheme = "dossier" | "moonletter" | "wayfarer";

/** @deprecated Use StoryDisplayTheme */
export type StoryReadingTheme = StoryDisplayTheme;

export type StoryColorMode = "light" | "dark";

export type StoryDisplayThemeOption = {
  id: StoryDisplayTheme;
  label: string;
  hint: string;
};

export const STORY_DISPLAY_THEMES: readonly StoryDisplayThemeOption[] = [
  { id: "dossier", label: "Dossier", hint: "Clean briefing — precise and professional" },
  { id: "moonletter", label: "Moonletter", hint: "Soft correspondence — a little romantic" },
  { id: "wayfarer", label: "Wayfarer", hint: "Field journal — rustic and adventurous" },
];

const DISPLAY_STORAGE_KEY = "mailtostory:story-display-theme";
const COLOR_MODE_STORAGE_KEY = "mailtostory:story-color-mode";
const LEGACY_STORAGE_KEY = "mailtostory:story-reading-theme";

function isStoryDisplayTheme(value: string | null): value is StoryDisplayTheme {
  return value === "dossier" || value === "moonletter" || value === "wayfarer";
}

function isStoryColorMode(value: string | null): value is StoryColorMode {
  return value === "light" || value === "dark";
}

export function parseStoryDisplayTheme(stored: string | null): StoryDisplayTheme {
  if (isStoryDisplayTheme(stored)) return stored;
  if (stored === "light") return "moonletter";
  return "dossier";
}

export function parseStoryColorMode(stored: string | null): StoryColorMode {
  if (isStoryColorMode(stored)) return stored;
  if (stored === "light") return "light";
  return "dark";
}

export function readStoryDisplayTheme(): StoryDisplayTheme {
  if (typeof window === "undefined") return "dossier";
  const direct = window.localStorage.getItem(DISPLAY_STORAGE_KEY);
  if (direct) return parseStoryDisplayTheme(direct);
  return parseStoryDisplayTheme(window.localStorage.getItem(LEGACY_STORAGE_KEY));
}

export function readStoryColorMode(): StoryColorMode {
  if (typeof window === "undefined") return "dark";
  const direct = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (direct) return parseStoryColorMode(direct);
  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy === "light") return "light";
  return "dark";
}

export function writeStoryDisplayTheme(theme: StoryDisplayTheme): void {
  window.localStorage.setItem(DISPLAY_STORAGE_KEY, theme);
}

export function writeStoryColorMode(mode: StoryColorMode): void {
  window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
}

export function storyPageThemeClass(
  display: StoryDisplayTheme,
  mode: StoryColorMode,
): string {
  const displayClass =
    display === "moonletter"
      ? " story-page--moonletter"
      : display === "wayfarer"
        ? " story-page--wayfarer"
        : " story-page--dossier";
  const modeClass = mode === "light" ? " story-page--light" : "";
  return `${displayClass}${modeClass}`;
}

const EXPORT_ALWAYS_DAY_KEY = "mailtostory:export-always-day-mode";

export function readExportAlwaysDayMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(EXPORT_ALWAYS_DAY_KEY) === "1";
}

export function writeExportAlwaysDayMode(enabled: boolean): void {
  window.localStorage.setItem(EXPORT_ALWAYS_DAY_KEY, enabled ? "1" : "0");
}

export function resolveExportColorMode(
  viewerColorMode: StoryColorMode,
  alwaysDayMode: boolean,
): StoryColorMode {
  return alwaysDayMode ? "light" : viewerColorMode;
}

/** @deprecated Use readStoryDisplayTheme */
export function readStoryReadingTheme(): StoryDisplayTheme {
  return readStoryDisplayTheme();
}

/** @deprecated Use writeStoryDisplayTheme */
export function writeStoryReadingTheme(theme: StoryDisplayTheme): void {
  writeStoryDisplayTheme(theme);
}

/** @deprecated Use storyPageThemeClass */
export function storyPageThemeClassLegacy(theme: StoryDisplayTheme): string {
  return storyPageThemeClass(theme, "dark");
}
