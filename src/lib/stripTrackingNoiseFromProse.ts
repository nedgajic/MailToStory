/**
 * Remove ESP / tracker query blobs and opaque tokens that leak into LLM narrative
 * (e.g. LinkedIn job alerts: Premium.,123&lipi=urn%3A...&otpToken=...).
 *
 * Use on display and export paths only — not when building model prompts.
 */

const TRACKING_PARAM =
  /&(?:lipi|midToken|midSig|trkEmail|otpToken|eid|ssid|fmid|trk)=[^&\s]*/gi;

const PREFIX_WITH_TRACKING =
  /\S*(?:&(?:lipi|midToken|midSig|trkEmail|otpToken|eid|ssid|fmid|trk)=[^&\s]*)/gi;

function tidyDigestWhitespace(s: string): string {
  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])\1+/g, "$1")
    .trim();
}

function isNoiseWhitespaceToken(s: string): boolean {
  const amp = s.split("&").length - 1;
  if (amp >= 2 && s.length >= 28 && /=[^=\s]/.test(s)) return true;
  if (amp >= 1 && s.length >= 64 && /=[^&\s]{24,}/.test(s)) return true;
  if (/^[A-Za-z][A-Za-z0-9]*\.,\d{6,}$/.test(s)) return true;
  return false;
}

/**
 * Strip one whitespace-bounded chunk that contains a tracking param (and optional
 * prefix like Premium.,440…) by repeatedly removing param segments from the end.
 */
function stripTrackingParamChains(text: string): string {
  let t = text;
  let guard = 0;
  while (guard++ < 64) {
    const next = t.replace(PREFIX_WITH_TRACKING, " ");
    if (next === t) break;
    t = tidyDigestWhitespace(next);
  }
  return t;
}

export function stripTrackingNoiseFromProse(text: string): string {
  if (!text) return text;
  let t = text.normalize("NFC");

  t = stripTrackingParamChains(t);

  t = t.replace(/\S*&trk=eml-[^\s]*/gi, " ");
  t = t.replace(/\S*urn%3Ali%3A[^\s]*/gi, " ");
  t = t.replace(/\S*\burn:li:[^\s]*/gi, " ");

  let prev = "";
  while (t !== prev) {
    prev = t;
    t = t.replace(TRACKING_PARAM, " ");
    t = tidyDigestWhitespace(t);
  }

  t = t.replace(/\b[A-Za-z0-9+%=_-]{120,}\b/g, " ");

  const parts = t.split(/\s+/).filter((w) => w && !isNoiseWhitespaceToken(w));
  t = parts.join(" ");

  return tidyDigestWhitespace(t);
}
