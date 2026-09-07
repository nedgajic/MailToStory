"use client";

import { useEffect } from "react";
import { notifyStoriesSummaryChanged } from "@/lib/stories-summary-events";

/** Re-sync nav badges after the server marks this story as viewed. */
export function StoryViewTracker() {
  useEffect(() => {
    notifyStoriesSummaryChanged();
  }, []);
  return null;
}
