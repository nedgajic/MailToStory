import md5 from "md5";

/** Gravatar with 404 so we can fall back to initials when no public avatar. */
export function gravatarAvatarUrl(email: string, sizePx: number): string {
  const normalized = email.trim().toLowerCase();
  const hash = md5(normalized);
  const s = Math.min(512, Math.max(24, Math.round(sizePx)));
  return `https://www.gravatar.com/avatar/${hash}?s=${s}&d=404`;
}

export type ParticipantLite = { name: string; email: string };

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
