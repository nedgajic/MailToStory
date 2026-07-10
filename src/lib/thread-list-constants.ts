/** Gmail `threads.list` page size (safe to import from Client Components). */
export const THREAD_LIST_PAGE_SIZE = 30;

/** Default inbox filter: hide single-message threads. */
export const DEFAULT_THREADS_ONLY = true;

export function minMessagesForThreadsOnly(threadsOnly: boolean): number {
  return threadsOnly ? 2 : 1;
}
