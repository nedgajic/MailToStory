/** Same pattern for extraction, stripping, and inline linkification in the digest UI. */
export const DIGEST_URL_IN_TEXT_RE =
  /https?:\/\/[^\s\])}'">,]+|www\.[^\s\])}'">,]+/gi;

/**
 * Remove URL-like spans from narrative text and tidy whitespace (for display when
 * links are shown as chips below).
 */
export function stripUrlsFromText(text: string): string {
  return text
    .replace(DIGEST_URL_IN_TEXT_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/**
 * Pull unique http(s) URLs from plain text (order preserved).
 * Trims common trailing punctuation from matches.
 */
export function extractUrlsFromText(text: string): string[] {
  const re = DIGEST_URL_IN_TEXT_RE;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    let raw = m[0];
    raw = raw.replace(/[.,;:!?)]+$/, "");
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    try {
      void new URL(href);
    } catch {
      continue;
    }
    if (!seen.has(href)) {
      seen.add(href);
      out.push(href);
    }
  }
  return out;
}

export function displayUrlLabel(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname === "/" ? "" : u.pathname;
    const tail = u.search || "";
    const compact = `${u.hostname}${path}${tail}`;
    return compact.length > 56 ? `${compact.slice(0, 53)}…` : compact;
  } catch {
    return href.length > 56 ? `${href.slice(0, 53)}…` : href;
  }
}
