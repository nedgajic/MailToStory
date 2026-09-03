const EXPORT_FILENAME_PREFIX = "MailToStory - ";
const MAX_EXPORT_FILENAME_LENGTH = 120;

/** Filesystem-safe export base name (no extension), e.g. `MailToStory - Q3 Budget Review`. */
export function digestPdfBaseFilename(title: string): string {
  const cleaned = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const base = `${EXPORT_FILENAME_PREFIX}${cleaned || "Story"}`;
  if (base.length <= MAX_EXPORT_FILENAME_LENGTH) return base;
  return base.slice(0, MAX_EXPORT_FILENAME_LENGTH).trimEnd();
}
