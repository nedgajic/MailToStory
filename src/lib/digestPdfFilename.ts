import { BRAND_NAME } from "@/lib/brand";

const EXPORT_FILENAME_PREFIX = `${BRAND_NAME} - `;
const MAX_EXPORT_FILENAME_LENGTH = 120;

/** Filesystem-safe export base name (no extension), e.g. `Mail To Story - Q3 Budget Review`. */
export function digestPdfBaseFilename(title: string): string {
  const cleaned = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const base = `${EXPORT_FILENAME_PREFIX}${cleaned || "Story"}`;
  if (base.length <= MAX_EXPORT_FILENAME_LENGTH) return base;
  return base.slice(0, MAX_EXPORT_FILENAME_LENGTH).trimEnd();
}
