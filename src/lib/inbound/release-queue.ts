const MAX_CONCURRENT = 2;

type Job = () => Promise<void>;

const queue: Job[] = [];
let active = 0;

function drainQueue(): void {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift();
    if (!job) return;
    active += 1;
    void job().finally(() => {
      active -= 1;
      drainQueue();
    });
  }
}

/** Run work in the background with limited concurrency (safe for bulk quarantine release). */
export function enqueueBackgroundJob(job: () => Promise<void>): void {
  queue.push(job);
  drainQueue();
}

export function backgroundQueueDepth(): { queued: number; active: number } {
  return { queued: queue.length, active };
}
