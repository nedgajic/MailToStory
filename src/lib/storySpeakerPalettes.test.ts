import { describe, expect, it } from "vitest";
import {
  assignSpeakerPaletteIndices,
  colorDistance,
  getStorySpeakerPalette,
  SPEAKER_PALETTE_SIZE,
} from "./storySpeakerPalettes";

describe("assignSpeakerPaletteIndices", () => {
  const themes = ["dossier", "moonletter", "wayfarer"] as const;
  const modes = ["light", "dark"] as const;

  it("assigns unique palette indices for up to six participants", () => {
    for (const theme of themes) {
      for (const colorMode of modes) {
        const keys = ["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com", "f@x.com"];
        const assigned = assignSpeakerPaletteIndices({
          participantKeysInOrder: keys,
          theme,
          colorMode,
        });
        const indices = [...assigned.values()];
        expect(indices).toHaveLength(keys.length);
        expect(new Set(indices).size).toBe(keys.length);
      }
    }
  });

  it("keeps first-turn speaker away from recap accent colors", () => {
    const palette = getStorySpeakerPalette("wayfarer", "dark");
    const firstKey = "alice@example.com";
    const assigned = assignSpeakerPaletteIndices({
      participantKeysInOrder: [firstKey, "bob@example.com"],
      firstTurnParticipantKey: firstKey,
      theme: "wayfarer",
      colorMode: "dark",
    });
    const firstIdx = assigned.get(firstKey)!;
    const firstAccent = palette.speakerAccent[firstIdx]!;
    for (const hint of palette.recapAccentHints) {
      expect(colorDistance(firstAccent, hint)).toBeGreaterThan(35);
    }
    expect(firstAccent).not.toBe("#e8c078");
  });

  it("maximizes separation between assigned participant accents", () => {
    const palette = getStorySpeakerPalette("dossier", "light");
    const keys = ["a@x.com", "b@x.com", "c@x.com"];
    const assigned = assignSpeakerPaletteIndices({
      participantKeysInOrder: keys,
      theme: "dossier",
      colorMode: "light",
    });
    const indices = keys.map((key) => assigned.get(key)!);
    for (let i = 0; i < indices.length; i += 1) {
      for (let j = i + 1; j < indices.length; j += 1) {
        const distance = colorDistance(
          palette.speakerAccent[indices[i]!]!,
          palette.speakerAccent[indices[j]!]!,
        );
        expect(distance).toBeGreaterThan(40);
      }
    }
  });

  it("uses every palette slot only once when six participants are present", () => {
    const keys = Array.from({ length: SPEAKER_PALETTE_SIZE }, (_, i) => `p${i}@x.com`);
    const assigned = assignSpeakerPaletteIndices({
      participantKeysInOrder: keys,
      theme: "moonletter",
      colorMode: "dark",
    });
    expect([...assigned.values()].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
