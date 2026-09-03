import md5 from "md5";

/** Gravatar with 404 so we can fall back to initials when no public avatar. */
export function gravatarAvatarUrl(email: string, sizePx: number): string {
  const normalized = email.trim().toLowerCase();
  const hash = md5(normalized);
  const s = Math.min(512, Math.max(24, Math.round(sizePx)));
  return `https://www.gravatar.com/avatar/${hash}?s=${s}&d=404`;
}

export type ParticipantLite = { name: string; email: string };

/** Strip a trailing `Name <email>` down to display name only. */
export function stripSpeakerLabelEmail(raw: string): string {
  const trimmed = raw.trim();
  const angle = trimmed.match(/^(.+?)\s*<[^>]+@[^>]+>$/i);
  if (angle) {
    return angle[1].replace(/^["']|["']$/g, "").trim();
  }
  return trimmed;
}

/**
 * Prefer the canonical participant name when we know their email.
 */
export function resolveParticipantDisplayName(
  speaker: string,
  participants: ParticipantLite[],
  email?: string | null,
): string {
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  if (normalizedEmail) {
    const match = participants.find(
      (p) => p.email?.trim().toLowerCase() === normalizedEmail,
    );
    if (match?.name?.trim()) return match.name.trim();
  }

  const stripped = stripSpeakerLabelEmail(speaker);
  if (stripped && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stripped)) {
    return stripped;
  }

  const resolvedEmail = resolveSpeakerToEmail(speaker, participants);
  if (resolvedEmail) {
    const match = participants.find(
      (p) => p.email?.trim().toLowerCase() === resolvedEmail,
    );
    if (match?.name?.trim()) return match.name.trim();
  }

  return stripped || speaker.trim();
}

export function getInitials(label: string): string {
  const cleaned = stripSpeakerLabelEmail(label).trim();
  if (!cleaned) return "?";

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    const local = cleaned.split("@")[0] ?? "";
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || "?";
  }

  const words = cleaned.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    const word = words[0]!;
    if (word.length >= 2) return word.slice(0, 2).toUpperCase();
    return word[0]!.toUpperCase();
  }

  const first = words[0]![0] ?? "";
  const last = words[words.length - 1]![0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function initialsForSpeaker(
  speaker: string,
  participants: ParticipantLite[],
  email?: string | null,
): string {
  return getInitials(resolveParticipantDisplayName(speaker, participants, email));
}

/**
 * Map a digest speaker / actor label to a participant email for Gravatar.
 */
export function resolveSpeakerToEmail(
  speaker: string,
  participants: ParticipantLite[],
): string | null {
  const raw = speaker.trim();
  if (!raw) return null;

  const angle = raw.match(/<([^>]+@[^>]+)>/i);
  if (angle) return angle[1].trim().toLowerCase();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return raw.toLowerCase();
  }

  const lower = raw.toLowerCase();

  for (const p of participants) {
    const em = p.email?.trim().toLowerCase();
    if (!em) continue;

    const name = (p.name || "").trim();
    const nameLower = name.toLowerCase();
    const first = name.split(/\s+/)[0]?.toLowerCase() ?? "";

    if (nameLower && lower === nameLower) return em;
    if (first && lower === first) return em;
    if (nameLower && nameLower.startsWith(`${lower} `)) return em;
  }

  return null;
}
