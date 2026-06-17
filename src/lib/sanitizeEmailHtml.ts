import sanitizeHtml from "sanitize-html";

const MAX_HTML_CHARS = 180_000;

/** Ignore cuts in the first N chars (headers / short intros). */
const MIN_CUT_HTML = 40;
/** Blockquotes in the main body are rare; late blockquotes are usually quoted thread. */
const MIN_BLOCKQUOTE_CUT = 120;
/** Gmail quote wrappers can start soon after a short reply. */
const MIN_GMAIL_STRUCTURE_CUT = 12;

function truncateAtPreviousTag(html: string, matchIndex: number): string {
  if (matchIndex <= 0) return html;
  const before = html.slice(0, matchIndex);
  const lastLt = before.lastIndexOf("<");
  if (lastLt <= 0) return html.slice(0, matchIndex).trim();
  return html.slice(0, lastLt).trim();
}

function pushCut(indices: number[], i: number, min: number): void {
  if (i !== -1 && i >= min) indices.push(i);
}

/**
 * Indices where quoted thread / reply history usually starts (Apple Mail, Gmail, Outlook).
 */
function collectHtmlReplyCutIndices(html: string): number[] {
  const s = html;
  const lower = s.toLowerCase();
  const indices: number[] = [];
  const m = MIN_CUT_HTML;

  let match: RegExpMatchArray | null;

  match = s.match(/-----Original Message-----/);
  pushCut(indices, match?.index ?? -1, m);

  match = s.match(/\n-{2,9}\s*Original Message\s*-{2,9}/i);
  pushCut(indices, match?.index ?? -1, m);

  match = s.match(/On\s+\d{1,2}\s+[\s\S]{3,900}?\bwrote\s*:/i);
  pushCut(indices, match?.index ?? -1, m);

  match = s.match(
    /On\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b[\s\S]{3,900}?\bwrote\s*:/i,
  );
  pushCut(indices, match?.index ?? -1, m);

  pushCut(indices, lower.indexOf("gmail_quote"), MIN_GMAIL_STRUCTURE_CUT);
  pushCut(indices, lower.indexOf('class="gmail_attr"'), MIN_GMAIL_STRUCTURE_CUT);
  pushCut(indices, lower.indexOf("<blockquote"), MIN_BLOCKQUOTE_CUT);
  pushCut(indices, lower.indexOf('<div style="border-top:solid'), m);

  return indices;
}

/**
 * Keep the sender's new content; drop quoted thread (Apple "On … wrote:", Gmail, blockquotes).
 * Runs on raw HTML before sanitization.
 */
export function takeInitialEmailHtml(html: string): string {
  const s = html.trim();
  if (!s) return "";

  const cuts = collectHtmlReplyCutIndices(s);
  if (cuts.length === 0) return s;
  return truncateAtPreviousTag(s, Math.min(...cuts));
}

export function sanitizeEmailHtml(html: string): string {
  const clipped =
    html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html;

  return sanitizeHtml(clipped, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "span",
      "div",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}
