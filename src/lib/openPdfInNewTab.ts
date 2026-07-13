/** Returns true when the browser accepted opening a new tab/window. */
export function openPdfInNewTab(url: string): boolean {
  const popup = window.open(url, "_blank");
  if (!popup) return false;

  try {
    if (popup.closed) return false;
  } catch {
    return false;
  }

  return true;
}
