import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";

/** One-line preview text for story library cards. */
export function storyCardExcerpt(text: string, maxLength = 192): string {
  const cleaned = stripTrackingNoiseFromProse(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;

  const slice = cleaned.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > maxLength * 0.45 ? slice.slice(0, lastSpace) : slice;
  return `${base}…`;
}
