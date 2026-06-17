/** Gmail `threads.list` page size (safe to import from Client Components). */
export const THREAD_LIST_PAGE_SIZE = 30;

/**
 * Parallel `threads.get` calls per batch while loading inbox metadata.
 * Higher = faster but more burst quota; Gmail allows generous per-user QPS.
 */
export const THREAD_LIST_METADATA_CONCURRENCY = 10;
