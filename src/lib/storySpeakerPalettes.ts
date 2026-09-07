import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";

export const SPEAKER_PALETTE_SIZE = 6;

export type StorySpeakerPalette = {
  speakerBg: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  speakerAccent: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  /** Prominent recap accents to keep the first story turn distinct from. */
  recapAccentHints: readonly string[];
};

/** Single source of truth for speaker colors in UI + PDF + Word. */
export const STORY_SPEAKER_PALETTES: Record<
  StoryDisplayTheme,
  Record<StoryColorMode, StorySpeakerPalette>
> = {
  dossier: {
    light: {
      speakerBg: ["#d4f5e2", "#ffd4d4", "#d4e4ff", "#ffe0ad", "#e4d9ff", "#c4f4eb"],
      speakerAccent: ["#059669", "#e11d48", "#2563eb", "#d97706", "#7c3aed", "#0d9488"],
      recapAccentHints: ["#1d4f91", "#2c2c30", "#4a4a4f", "#d4cec4"],
    },
    dark: {
      speakerBg: ["#1e3a2f", "#3a2020", "#1e2a3a", "#3a3420", "#2e2438", "#1a3330"],
      speakerAccent: ["#81c995", "#f87171", "#60a5fa", "#fbbf24", "#c084fc", "#2dd4bf"],
      recapAccentHints: ["#8ab4f8", "#9aa0a6", "#e8eaed", "#5a6578"],
    },
  },
  moonletter: {
    light: {
      speakerBg: ["#93c5fd", "#5eead4", "#fdba74", "#c4b5fd", "#f0abfc", "#fcd34d"],
      speakerAccent: ["#1d4ed8", "#047857", "#ea580c", "#7c3aed", "#db2777", "#d97706"],
      recapAccentHints: ["#b44d78", "#8a5068", "#f0d4df", "#4a3040"],
    },
    dark: {
      speakerBg: ["#1a2840", "#1a3330", "#3a2818", "#3e1a48", "#3a1a30", "#3a2e10"],
      speakerAccent: ["#60a5fa", "#34d399", "#fb923c", "#e879f9", "#f472b6", "#facc15"],
      recapAccentHints: ["#f0c9d6", "#f3b8cc", "#f4e7ee", "#7a4a5e"],
    },
  },
  wayfarer: {
    light: {
      speakerBg: ["#ffd0d0", "#cce8b0", "#b8d4ff", "#ffe08a", "#e8b8f8", "#a8eef0"],
      speakerAccent: ["#dc2626", "#15803d", "#1d4ed8", "#d97706", "#a21caf", "#0d9488"],
      recapAccentHints: ["#8a5820", "#c4a574", "#3a2c18", "#efe4cc"],
    },
    dark: {
      speakerBg: ["#3a1818", "#283818", "#202838", "#3a3010", "#381828", "#183038"],
      speakerAccent: ["#f87171", "#86efac", "#7dd3fc", "#fcd34d", "#f0abfc", "#fdba74"],
      recapAccentHints: ["#e8c078", "#c4a574", "#efe2c6", "#6a5028"],
    },
  },
};

export function getStorySpeakerPalette(
  theme: StoryDisplayTheme = "dossier",
  colorMode: StoryColorMode = "dark",
): StorySpeakerPalette {
  return STORY_SPEAKER_PALETTES[theme][colorMode];
}

export function speakerPaletteCssProperties(
  theme: StoryDisplayTheme,
  colorMode: StoryColorMode,
): Record<string, string> {
  const palette = getStorySpeakerPalette(theme, colorMode);
  const vars: Record<string, string> = {};
  for (let i = 0; i < SPEAKER_PALETTE_SIZE; i += 1) {
    vars[`--digest-speaker-${i}-bg`] = palette.speakerBg[i]!;
    vars[`--digest-speaker-${i}-accent`] = palette.speakerAccent[i]!;
  }
  return vars;
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return [0, 0, 0];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function minAccentDistance(
  idx: number,
  palette: StorySpeakerPalette,
  compare: (hex: string) => number,
): number {
  const accent = palette.speakerAccent[idx]!;
  let min = Infinity;
  for (const other of palette.speakerAccent) {
    if (other === accent) continue;
    min = Math.min(min, compare(other));
  }
  return min;
}

function minDistanceToHints(
  idx: number,
  palette: StorySpeakerPalette,
): number {
  const accent = palette.speakerAccent[idx]!;
  let min = Infinity;
  for (const hint of palette.recapAccentHints) {
    min = Math.min(min, colorDistance(accent, hint));
  }
  return min;
}

function minDistanceToAssigned(
  idx: number,
  palette: StorySpeakerPalette,
  assignedIndices: number[],
): number {
  if (assignedIndices.length === 0) return Infinity;
  const accent = palette.speakerAccent[idx]!;
  let min = Infinity;
  for (const otherIdx of assignedIndices) {
    min = Math.min(min, colorDistance(accent, palette.speakerAccent[otherIdx]!));
  }
  return min;
}

function pickBestPaletteIndex(
  palette: StorySpeakerPalette,
  used: Set<number>,
  score: (idx: number) => number,
): number {
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let idx = 0; idx < SPEAKER_PALETTE_SIZE; idx += 1) {
    if (used.has(idx)) continue;
    const value = score(idx);
    if (value > bestScore) {
      bestScore = value;
      bestIdx = idx;
    }
  }
  return bestIdx;
}

/** Assign a unique palette index per participant with recap + contrast constraints. */
export function assignSpeakerPaletteIndices(input: {
  participantKeysInOrder: string[];
  firstTurnParticipantKey?: string | null;
  theme: StoryDisplayTheme;
  colorMode: StoryColorMode;
}): Map<string, number> {
  const palette = getStorySpeakerPalette(input.theme, input.colorMode);
  const uniqueKeys: string[] = [];
  for (const key of input.participantKeysInOrder) {
    if (!key || uniqueKeys.includes(key)) continue;
    uniqueKeys.push(key);
  }

  const assigned = new Map<string, number>();
  const used = new Set<number>();
  const assignedIndices: number[] = [];

  const assignKey = (key: string, preferRecapClear: boolean) => {
    const idx = pickBestPaletteIndex(palette, used, (candidate) => {
      const separation = minDistanceToAssigned(candidate, palette, assignedIndices);
      const spread = minAccentDistance(candidate, palette, (other) =>
        colorDistance(palette.speakerAccent[candidate]!, other),
      );
      const recapGap = preferRecapClear
        ? minDistanceToHints(candidate, palette)
        : 0;
      return recapGap * 3 + separation * 2 + spread;
    });
    assigned.set(key, idx);
    used.add(idx);
    assignedIndices.push(idx);
  };

  const firstKey = input.firstTurnParticipantKey?.trim();
  if (firstKey && uniqueKeys.includes(firstKey)) {
    assignKey(firstKey, true);
  }

  for (const key of uniqueKeys) {
    if (assigned.has(key)) continue;
    assignKey(key, false);
  }

  return assigned;
}
