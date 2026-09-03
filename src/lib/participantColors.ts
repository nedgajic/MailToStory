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

/** Stable left-to-right slot per participant (Wayfarer panel offsets). */
export function buildParticipantLaneMap(
  participants: ParticipantLite[],
): Map<string, number> {
  const uniqueKeys: string[] = [];
  for (const participant of participants) {
    const key = participantKey(participant);
    if (!key || uniqueKeys.includes(key)) continue;
    uniqueKeys.push(key);
  }

  const map = new Map<string, number>();
  uniqueKeys.forEach((key, index) => map.set(key, index));
  return map;
}

export function participantLaneIndex(
  participants: ParticipantLite[],
  speaker: string | null | undefined,
  email: string | null,
  laneMap?: Map<string, number>,
): number | null {
  const who = speaker?.trim();
  if (!who) return null;

  const map = laneMap ?? buildParticipantLaneMap(participants);
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

/** Horizontal inset for an 80%-width Wayfarer panel (0 = left, 20% of recap = right). */
export function wayfarerPanelOffsetPercent(slot: number, total: number): string {
  if (total <= 1) {
    return "calc(var(--wayfarer-recap-panel-width, 100%) * 0.1)";
  }
  if (slot <= 0) return "0";
  const ratio = slot / (total - 1);
  return `calc(var(--wayfarer-recap-panel-width, 100%) * ${ratio} * 0.2)`;
}

function stableUnitFloat(seed: string, salt = ""): number {
  let hash = 0;
  const input = `${seed}${salt}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33 + input.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 10_000) / 10_000;
}

export type MoonletterParticipantPanelLayout = {
  widthRatio: number;
  offsetRatio: number;
};

/** Stable Moonletter turn width (70–95% of recap) and horizontal offset per participant. */
export function moonletterParticipantPanelLayout(
  participantKey: string,
): MoonletterParticipantPanelLayout {
  const widthRatio = 0.7 + stableUnitFloat(participantKey, ":w") * 0.25;
  const maxOffset = 1 - widthRatio;
  const offsetRatio = stableUnitFloat(participantKey, ":o") * maxOffset;
  return { widthRatio, offsetRatio };
}

export function moonletterPanelWidthCss(widthRatio: number): string {
  return `calc(var(--moonletter-recap-panel-width, 100%) * ${widthRatio})`;
}

export function moonletterPanelOffsetCss(offsetRatio: number): string {
  return `calc(var(--moonletter-recap-panel-width, 100%) * ${offsetRatio})`;
}
