import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import { getStorySpeakerPalette } from "@/lib/storySpeakerPalettes";

/** Matches web `border-radius` — uniform px or per-corner (e.g. Moonletter recap). */
export type ExportBorderRadius =
  | number
  | {
      topLeft: number;
      topRight: number;
      bottomRight: number;
      bottomLeft: number;
    };

export function pdfBorderRadius(
  radius: ExportBorderRadius,
): Record<string, number> {
  if (typeof radius === "number") {
    return { borderRadius: radius };
  }
  return {
    borderTopLeftRadius: radius.topLeft,
    borderTopRightRadius: radius.topRight,
    borderBottomRightRadius: radius.bottomRight,
    borderBottomLeftRadius: radius.bottomLeft,
  };
}

export function exportStatusPillBorderRadius(
  recapBorderRadius: ExportBorderRadius,
): number {
  if (typeof recapBorderRadius === "number") {
    return recapBorderRadius > 8 ? 10 : 2;
  }
  return 10;
}

export type DigestExportThemeConfig = {
  pageBg: string;
  prose: string;
  proseSoft: string;
  proseSofter: string;
  proseFaint: string;
  muted: string;
  title: string;
  titleSub: string;
  copyFg: string;
  border: string;
  borderStrong: string;
  surface2: string;
  recapSummary: string;
  recapTint: string;
  recapRule: string;
  recapRuleStrong: string;
  timelineLine: string;
  speakerBg: readonly [string, string, string, string, string, string];
  speakerAccent: readonly [string, string, string, string, string, string];
  serifFont: string;
  monoFont: string;
  titleSize: number;
  titleItalic: boolean;
  titleUppercase: boolean;
  proseSize: number;
  proseLineHeight: number;
  recapSize: number;
  recapItalic: boolean;
  speakerCaps: boolean;
  speakerLetterSpacing: number;
  panelBorderRadius: ExportBorderRadius;
  panelBorderLeftWidth: number;
  panelUseRightAccent: boolean;
  recapBorderRadius: ExportBorderRadius;
  recapBorderStyle: "solid" | "dashed";
  recapBorderWidth: number;
  recapBorderLeftAccentWidth: number;
  sectionLetterSpacing: number;
};

const DOSSIER_LIGHT: DigestExportThemeConfig = {
  pageBg: "#ffffff",
  prose: "#1c1c1e",
  proseSoft: "#4a4a4f",
  proseSofter: "#6b6b70",
  proseFaint: "#8e8e93",
  muted: "#6b6b70",
  title: "#121214",
  titleSub: "#5c5c62",
  copyFg: "#1d4f91",
  border: "#e2ddd3",
  borderStrong: "#cdc7bb",
  surface2: "#f5f2eb",
  recapSummary: "#2c2c30",
  recapTint: "#f7f4ed",
  recapRule: "#d4cec4",
  recapRuleStrong: "#b8b2a6",
  timelineLine: "#d4cec4",
  ...getStorySpeakerPalette("dossier", "light"),
  serifFont: "Lora",
  monoFont: "DM Mono",
  titleSize: 22,
  titleItalic: false,
  titleUppercase: false,
  proseSize: 11.5,
  proseLineHeight: 1.85,
  recapSize: 12,
  recapItalic: true,
  speakerCaps: false,
  speakerLetterSpacing: 0.2,
  panelBorderRadius: 2,
  panelBorderLeftWidth: 3,
  panelUseRightAccent: false,
  recapBorderRadius: 2,
  recapBorderStyle: "solid",
  recapBorderWidth: 1,
  recapBorderLeftAccentWidth: 3,
  sectionLetterSpacing: 1.6,
};

const DOSSIER_DARK: DigestExportThemeConfig = {
  ...DOSSIER_LIGHT,
  pageBg: "#0e1628",
  prose: "#e8eaed",
  proseSoft: "#c8ccd0",
  proseSofter: "#9aa0a6",
  proseFaint: "#80868b",
  muted: "#9aa0a6",
  title: "#f0f6ff",
  titleSub: "#bdc1c6",
  copyFg: "#8ab4f8",
  border: "#3c4858",
  borderStrong: "#4a5568",
  surface2: "#1a2438",
  recapSummary: "#e8eaed",
  recapTint: "#152238",
  recapRule: "#3c4858",
  recapRuleStrong: "#5a6578",
  timelineLine: "#4a5568",
  ...getStorySpeakerPalette("dossier", "dark"),
};

const MOONLETTER_LIGHT: DigestExportThemeConfig = {
  pageBg: "#fff8fb",
  prose: "#3a2430",
  proseSoft: "#7a4a5e",
  proseSofter: "#9a6678",
  proseFaint: "#b88898",
  muted: "#9a6678",
  title: "#2a1520",
  titleSub: "#8a5068",
  copyFg: "#b44d78",
  border: "#f0d4df",
  borderStrong: "#e8b8cc",
  surface2: "#fff0f6",
  recapSummary: "#4a3040",
  recapTint: "#fff4f8",
  recapRule: "#f0d4df",
  recapRuleStrong: "#e8b8cc",
  timelineLine: "#e8c4d4",
  ...getStorySpeakerPalette("moonletter", "light"),
  serifFont: "Lora",
  monoFont: "Lora",
  titleSize: 26,
  titleItalic: true,
  titleUppercase: false,
  proseSize: 12.5,
  proseLineHeight: 1.78,
  recapSize: 13,
  recapItalic: true,
  speakerCaps: false,
  speakerLetterSpacing: 0.4,
  panelBorderRadius: 23,
  panelBorderLeftWidth: 0,
  panelUseRightAccent: false,
  recapBorderRadius: {
    topLeft: 26,
    topRight: 26,
    bottomRight: 26,
    bottomLeft: 7,
  },
  recapBorderStyle: "solid",
  recapBorderWidth: 1,
  recapBorderLeftAccentWidth: 0,
  sectionLetterSpacing: 1.2,
};

const MOONLETTER_DARK: DigestExportThemeConfig = {
  ...MOONLETTER_LIGHT,
  pageBg: "#1a1220",
  prose: "#f4e7ee",
  proseSoft: "#d9b8c6",
  proseSofter: "#c49aac",
  proseFaint: "#a67c90",
  muted: "#c49aac",
  title: "#fff4f8",
  titleSub: "#e0b7c8",
  copyFg: "#f3b8cc",
  border: "#5c3a4a",
  borderStrong: "#7a4a5e",
  surface2: "#2e1c2a",
  recapSummary: "#f4e7ee",
  recapTint: "#2a1828",
  recapRule: "#5c3a4a",
  recapRuleStrong: "#7a4a5e",
  timelineLine: "#6a4050",
  ...getStorySpeakerPalette("moonletter", "dark"),
};

const WAYFARER_LIGHT: DigestExportThemeConfig = {
  pageBg: "#f4ead4",
  prose: "#2a2010",
  proseSoft: "#5c4828",
  proseSofter: "#7a6240",
  proseFaint: "#9a8050",
  muted: "#7a6240",
  title: "#1a1408",
  titleSub: "#6a5028",
  copyFg: "#8a5820",
  border: "#c4a574",
  borderStrong: "#a88850",
  surface2: "#ebe0c8",
  recapSummary: "#3a2c18",
  recapTint: "#efe4cc",
  recapRule: "#c4a574",
  recapRuleStrong: "#a88850",
  timelineLine: "#c4a574",
  ...getStorySpeakerPalette("wayfarer", "light"),
  serifFont: "DM Mono",
  monoFont: "DM Mono",
  titleSize: 18,
  titleItalic: false,
  titleUppercase: true,
  proseSize: 10.5,
  proseLineHeight: 1.72,
  recapSize: 11,
  recapItalic: false,
  speakerCaps: true,
  speakerLetterSpacing: 0.8,
  panelBorderRadius: 2,
  panelBorderLeftWidth: 3,
  panelUseRightAccent: true,
  recapBorderRadius: 14,
  recapBorderStyle: "dashed",
  recapBorderWidth: 2,
  recapBorderLeftAccentWidth: 0,
  sectionLetterSpacing: 2.2,
};

const WAYFARER_DARK: DigestExportThemeConfig = {
  ...WAYFARER_LIGHT,
  pageBg: "#1c140c",
  prose: "#efe2c6",
  proseSoft: "#d4c19a",
  proseSofter: "#b89a6a",
  proseFaint: "#9a7c4c",
  muted: "#c4a574",
  title: "#f6e6c2",
  titleSub: "#d4ae6a",
  copyFg: "#e8c078",
  border: "#6a5028",
  borderStrong: "#8a6838",
  surface2: "#2a1c10",
  recapSummary: "#efe2c6",
  recapTint: "#24180c",
  recapRule: "#6a5028",
  recapRuleStrong: "#8a6838",
  timelineLine: "#8a6838",
  ...getStorySpeakerPalette("wayfarer", "dark"),
};

const EXPORT_THEMES_LIGHT: Record<StoryDisplayTheme, DigestExportThemeConfig> = {
  dossier: DOSSIER_LIGHT,
  moonletter: MOONLETTER_LIGHT,
  wayfarer: WAYFARER_LIGHT,
};

const EXPORT_THEMES_DARK: Record<StoryDisplayTheme, DigestExportThemeConfig> = {
  dossier: DOSSIER_DARK,
  moonletter: MOONLETTER_DARK,
  wayfarer: WAYFARER_DARK,
};

export function getDigestExportTheme(
  displayTheme: StoryDisplayTheme = "dossier",
  colorMode: StoryColorMode = "light",
): DigestExportThemeConfig {
  const themes =
    colorMode === "dark" ? EXPORT_THEMES_DARK : EXPORT_THEMES_LIGHT;
  return themes[displayTheme] ?? themes.dossier;
}

/** @deprecated Use getDigestExportTheme */
export const DIGEST_EXPORT_THEME = DOSSIER_LIGHT;
