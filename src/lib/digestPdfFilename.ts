/** ASCII-safe base name for PDF download (no extension). */
export function digestPdfBaseFilename(title: string): string {
  const ascii = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return ascii || "gmail-story";
}
