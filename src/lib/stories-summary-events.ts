/** Client-safe helpers for refreshing the Stories nav badge after view/quarantine changes. */

export const STORIES_SUMMARY_CHANGED_EVENT = "mailtostory:stories-summary-changed";

export function notifyStoriesSummaryChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STORIES_SUMMARY_CHANGED_EVENT));
}
