export type StoryDisplayTheme = "dossier" | "moonletter" | "wayfarer";

/** @deprecated Use StoryDisplayTheme */
export type StoryReadingTheme = StoryDisplayTheme;

export type StoryColorMode = "light" | "dark";

export type StoryDisplayThemeOption = {
  id: StoryDisplayTheme;
  label: string;
  hint: string;
};

export type StoryDisplayThemePreview = {
  itemBackground: string;
  accent: string;
  border: string;
  labelColor: string;
  hintColor: string;
  radius?: string;
  borderStyle?: "solid" | "dashed";
};

/** Full menu-item preview styling for the theme picker. */
export const STORY_DISPLAY_THEME_PREVIEWS: Record<
  StoryDisplayTheme,
  StoryDisplayThemePreview
> = {
  dossier: {
    itemBackground: "linear-gradient(168deg, #eef4fb 0%, #e3edf8 100%)",
    accent: "#6b9bd4",
    border: "rgb(138 180 248 / 0.38)",
    labelColor: "#2a4a72",
    hintColor: "rgb(42 74 114 / 0.72)",
    radius: "2px",
  },
  moonletter: {
    itemBackground: "linear-gradient(168deg, oklch(89.5% 0.048 36) 0%, oklch(96.5% 0.048 36) 100%)",
    accent: "#c47868",
    border: "rgb(220 168 152 / 0.48)",
    labelColor: "#5a3428",
    hintColor: "rgb(74 56 88 / 0.72)",
    radius: "10px",
  },
  wayfarer: {
    itemBackground: "linear-gradient(168deg, #f7eed8 0%, #ede4cc 100%)",
    accent: "#c4954a",
    border: "rgb(196 149 74 / 0.38)",
    labelColor: "#6a5028",
    hintColor: "rgb(106 80 40 / 0.72)",
    radius: "2px",
    borderStyle: "dashed",
  },
};

/** @deprecated Use STORY_DISPLAY_THEME_PREVIEWS */
export const STORY_DISPLAY_THEME_SWATCHES = STORY_DISPLAY_THEME_PREVIEWS;

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
