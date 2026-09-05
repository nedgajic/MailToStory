"use client";

import { useEffect, useState } from "react";
import { STORIES_SUMMARY_CHANGED_EVENT } from "@/lib/stories-summary-events";

export function useStoriesNavBadgeCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/stories/summary", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { navBadgeCount?: number };
        if (!cancelled) setCount(data.navBadgeCount ?? 0);
      } catch {
        // ignore
      }
    }

    void load();
    const onChange = () => void load();
    window.addEventListener(STORIES_SUMMARY_CHANGED_EVENT, onChange);
    const interval = window.setInterval(load, 30_000);

    return () => {
      cancelled = true;
      window.removeEventListener(STORIES_SUMMARY_CHANGED_EVENT, onChange);
      window.clearInterval(interval);
    };
  }, [enabled]);

  return count;
}

export function StoriesNavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="mkt-nav__badge" aria-label={`${label} updates`}>
      {label}
    </span>
  );
}
