const LOCAL_PART_MAX = 48;
const LOCAL_PART_MIN = 2;

/** Reserved for system/trust — not available as workspace inbox slugs. */
export const RESERVED_INBOUND_LOCAL_PARTS = new Set([
  "abuse",
  "admin",
  "api",
  "billing",
  "help",
  "hostmaster",
  "inbox",
  "mail",
  "mailer-daemon",
  "noreply",
  "no-reply",
  "postmaster",
  "root",
  "security",
  "support",
  "team",
  "webmaster",
  "www",
]);

export function slugifyInboundBase(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LOCAL_PART_MAX);
  return slug || "inbox";
}

/** Preferred local-part variants from a display name (first name first). */
export function inboundLocalPartCandidates(displayName: string): string[] {
  const trimmed = displayName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const full = slugifyInboundBase(trimmed);
  const first = parts[0] ? slugifyInboundBase(parts[0]) : full;
  const last =
    parts.length > 1 ? slugifyInboundBase(parts[parts.length - 1]!) : "";
  const firstLast =
    first && last && first !== last
      ? slugifyInboundBase(`${first}-${last}`).slice(0, LOCAL_PART_MAX)
      : "";

  const ordered = [first, firstLast, full, `${first}-mail`, `${first}-threads`];
  const seen = new Set<string>();
  return ordered.filter((candidate) => {
    if (!candidate || candidate.length < 2 || seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  });
}

export async function allocateUniqueInboundLocalPart(
  displayName: string,
  isTaken: (localPart: string) => Promise<boolean>,
): Promise<string> {
  const candidates = inboundLocalPartCandidates(displayName);
  for (const candidate of candidates) {
    if (!(await isTaken(candidate))) return candidate;
  }
  const base = candidates[0] ?? slugifyInboundBase(displayName);
  for (let n = 2; n <= 999; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, LOCAL_PART_MAX - suffix.length)}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Could not allocate an inbound address.");
}

export function isValidWorkspaceDisplayName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  return slugifyInboundBase(trimmed).length >= 2;
}

export function normalizeInboundLocalPart(input: string): string {
  return slugifyInboundBase(input);
}

export type InboundLocalPartValidation =
  | { ok: true; slug: string }
  | { ok: false; code: "INVALID_INBOX_SLUG" | "RESERVED_INBOX_SLUG" };

export function validateInboundLocalPart(input: string): InboundLocalPartValidation {
  const slug = normalizeInboundLocalPart(input);
  if (slug.length < LOCAL_PART_MIN || slug.length > LOCAL_PART_MAX) {
    return { ok: false, code: "INVALID_INBOX_SLUG" };
  }
  if (RESERVED_INBOUND_LOCAL_PARTS.has(slug)) {
    return { ok: false, code: "RESERVED_INBOX_SLUG" };
  }
  return { ok: true, slug };
}
