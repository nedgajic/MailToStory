import {
  assignSpeakerPaletteIndices,
  SPEAKER_PALETTE_SIZE,
} from "@/lib/storySpeakerPalettes";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import type { ParticipantLite } from "@/lib/speakerAvatar";
import { resolveSpeakerToEmail } from "@/lib/speakerAvatar";

export { SPEAKER_PALETTE_SIZE, speakerPaletteCssProperties } from "@/lib/storySpeakerPalettes";

export function participantKey(participant: ParticipantLite): string {
  const email = participant.email?.trim().toLowerCase();
  if (email) return email;
  return participant.name.trim().toLowerCase();
}

export function speakerColorKey(
  speaker: string,
  email: string | null,
): string {
  if (email?.trim()) return email.trim().toLowerCase();
  return speaker.trim().toLowerCase();
}

export function buildParticipantColorMap(
  participants: ParticipantLite[],
  options: {
    theme: StoryDisplayTheme;
    colorMode: StoryColorMode;
    firstTurnParticipantKey?: string | null;
  },
): Map<string, number> {
  const keysInOrder = participants
    .map((participant) => participantKey(participant))
    .filter(Boolean);

  return assignSpeakerPaletteIndices({
    participantKeysInOrder: keysInOrder,
    firstTurnParticipantKey: options.firstTurnParticipantKey,
    theme: options.theme,
    colorMode: options.colorMode,
  });
}

export function participantColorIndex(
  participants: ParticipantLite[],
  speaker: string | null | undefined,
  email: string | null,
  colorMap?: Map<string, number>,
): number | null {
  const who = speaker?.trim();
  if (!who) return null;

  const map =
    colorMap ??
    buildParticipantColorMap(participants, {
      theme: "dossier",
      colorMode: "dark",
    });
  const resolvedEmail = email ?? resolveSpeakerToEmail(who, participants);
  const key = speakerColorKey(who, resolvedEmail);
  if (map.has(key)) return map.get(key)!;

  if (resolvedEmail && map.has(resolvedEmail)) {
    return map.get(resolvedEmail)!;
  }

  const lower = who.toLowerCase();
  const first = lower.split(/\s+/)[0] ?? "";
  for (const [mapKey, index] of map) {
    if (mapKey === lower) return index;
    if (first && (mapKey.startsWith(`${first} `) || mapKey === first)) {
      return index;
    }
    const participant = participants.find(
      (p) => participantKey(p) === mapKey,
    );
    const name = participant?.name?.trim().toLowerCase() ?? "";
    if (name && (name === lower || name.startsWith(`${lower} `))) {
      return index;
    }
  }

  return null;
}
