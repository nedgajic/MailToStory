"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PendingStories, type PendingConversation } from "@/components/stories/pending-stories";
import {
  StoriesLibrary,
  type StoryCardData,
} from "@/components/stories/stories-library";
import { StoryGenerationCard } from "@/components/stories/story-generation-card";
import { useAppToast } from "@/components/ui/app-toast";
import {
  splitPendingConversations,
  type PendingConversationLive,
  type StoryLiveSnapshot,
} from "@/lib/story-live-status";

const FAST_POLL_MS = 3_000;
const SLOW_POLL_MS = 12_000;

type LiveResponse = {
  pending?: PendingConversationLive[];
  stories?: StoryLiveSnapshot[];
};

function toStoryCard(story: StoryLiveSnapshot): StoryCardData {
  return {
    id: story.id,
    title: story.title,
    subject: story.subject,
    status: story.status,
    resolutionSummary: story.resolutionSummary,
    createdAt: story.createdAt,
  };
}

export function StoriesDashboard({
  initialStories,
  initialPending,
  inbound,
  isFree,
  verified,
  deletedCount,
  showDeletedBanner = false,
  initialLibraryView = "active",
}: {
  initialStories: StoryCardData[];
  initialPending: PendingConversation[];
  inbound: string;
  isFree: boolean;
  verified: boolean;
  deletedCount: number;
  showDeletedBanner?: boolean;
  initialLibraryView?: "active" | "deleted";
}) {
  const { showToast } = useAppToast();
  const [stories, setStories] = useState(initialStories);
  const [pending, setPending] = useState(initialPending);
  const [manualGeneratingIds, setManualGeneratingIds] = useState<string[]>([]);
  const [manualStartedAt, setManualStartedAt] = useState<Record<string, string>>({});
  const [highlightedStoryIds, setHighlightedStoryIds] = useState<string[]>([]);
  const knownStoryIdsRef = useRef(new Set(initialStories.map((story) => story.id)));
  const pendingConversationIdsRef = useRef(new Set(initialPending.map((item) => item.id)));
  const abortRef = useRef<AbortController | null>(null);

  const { generating, stalled } = splitPendingConversations(pending);
  const generatingIds = new Set([
    ...generating.map((item) => item.id),
    ...manualGeneratingIds,
  ]);
  const generatingItems = [
    ...generating,
    ...pending.filter(
      (item) =>
        manualGeneratingIds.includes(item.id) &&
        !generating.some((entry) => entry.id === item.id),
    ),
  ];
  const stalledItems = stalled.filter((item) => !manualGeneratingIds.includes(item.id));

  const shouldPollFast =
    generatingIds.size > 0 ||
    manualGeneratingIds.length > 0 ||
    (verified && stories.length === 0 && pending.length === 0);

  const highlightNewStories = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setHighlightedStoryIds((current) => Array.from(new Set([...ids, ...current])));
    for (const id of ids) {
      window.setTimeout(() => {
        setHighlightedStoryIds((current) => current.filter((entry) => entry !== id));
      }, 2_600);
    }
  }, []);

  const applyLiveSnapshot = useCallback(
    (data: LiveResponse) => {
      const nextPending = data.pending ?? [];
      const nextStories = (data.stories ?? []).map(toStoryCard);

      setPending(nextPending);

      const freshStories = nextStories.filter(
        (story) => !knownStoryIdsRef.current.has(story.id),
      );
      if (freshStories.length > 0) {
        setStories((current) => {
          const merged = [...freshStories, ...current];
          const seen = new Set<string>();
          return merged.filter((story) => {
            if (seen.has(story.id)) return false;
            seen.add(story.id);
            return true;
          });
        });
        for (const story of freshStories) {
          knownStoryIdsRef.current.add(story.id);
          showToast({
            message: `"${story.title}" is ready.`,
            action: { label: "Open story", href: `/stories/${story.id}` },
          });
        }
        highlightNewStories(freshStories.map((story) => story.id));
      }

      const nextPendingIds = new Set(nextPending.map((item) => item.id));
      for (const id of pendingConversationIdsRef.current) {
        if (!nextPendingIds.has(id)) {
          setManualGeneratingIds((current) => current.filter((entry) => entry !== id));
          setManualStartedAt((current) => {
            if (!(id in current)) return current;
            const next = { ...current };
            delete next[id];
            return next;
          });
        }
      }
      pendingConversationIdsRef.current = nextPendingIds;
    },
    [showToast, highlightNewStories],
  );

  const pollLive = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/stories/live", {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as LiveResponse;
      applyLiveSnapshot(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }, [applyLiveSnapshot]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;

    const schedule = () => {
      if (cancelled) return;
      const hidden = document.visibilityState === "hidden";
      const interval =
        hidden && generatingIds.size === 0 && manualGeneratingIds.length === 0
          ? SLOW_POLL_MS * 2
          : shouldPollFast
            ? FAST_POLL_MS
            : SLOW_POLL_MS;
      timeoutId = window.setTimeout(async () => {
        await pollLive();
        schedule();
      }, interval);
    };

    void pollLive();
    schedule();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void pollLive();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
      abortRef.current?.abort();
    };
  }, [pollLive, shouldPollFast, generatingIds.size, manualGeneratingIds.length]);

  function handleManualGenerating(conversationId: string) {
    pendingConversationIdsRef.current.add(conversationId);
    setManualStartedAt((current) => ({
      ...current,
      [conversationId]: new Date().toISOString(),
    }));
    setManualGeneratingIds((current) =>
      current.includes(conversationId) ? current : [...current, conversationId],
    );
  }

  function handleManualGenerationEnd(conversationId: string) {
    setManualGeneratingIds((current) => current.filter((id) => id !== conversationId));
    setManualStartedAt((current) => {
      if (!(conversationId in current)) return current;
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
  }

  function handleStoryGenerated(story: StoryCardData & { conversationId: string }) {
    knownStoryIdsRef.current.add(story.id);
    setStories((current) => {
      if (current.some((entry) => entry.id === story.id)) return current;
      return [story, ...current];
    });
    setPending((current) => current.filter((item) => item.id !== story.conversationId));
    setManualGeneratingIds((current) =>
      current.filter((id) => id !== story.conversationId),
    );
    setManualStartedAt((current) => {
      if (!(story.conversationId in current)) return current;
      const next = { ...current };
      delete next[story.conversationId];
      return next;
    });
    showToast({
      message: `"${story.title}" is ready.`,
      action: { label: "Open story", href: `/stories/${story.id}` },
    });
    highlightNewStories([story.id]);
  }

  return (
    <>
      {generatingItems.length > 0 ? (
        <section className="dash-panel dash-panel--flat stories-live" aria-live="polite">
          <div className="dash-panel__head">
            <h2>Creating now</h2>
          </div>
          <p className="dash-muted stories-live__intro">
            We received your forwarded thread and are turning it into a story. This page
            updates automatically — no refresh needed.
          </p>
          <ul className="stories-live__list">
            {generatingItems.map((item) => (
              <li key={item.id}>
                <StoryGenerationCard
                  subject={item.subject}
                  snippet={item.snippet}
                  startedAt={manualStartedAt[item.id] ?? item.lastMessageAt}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : verified && stories.length === 0 && pending.length === 0 ? (
        <section className="dash-panel dash-panel--flat stories-live stories-live--watching">
          <div className="stories-live__watching">
            <span className="stories-live__watching-dot" aria-hidden />
            <div>
              <p className="stories-live__watching-title">Waiting for your first forward</p>
              <p className="dash-muted stories-live__watching-copy">
                Forward an email thread to your address below. When it arrives, progress
                will show up here instantly.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <PendingStories
        initial={stalledItems}
        onGenerating={handleManualGenerating}
        onGenerationEnd={handleManualGenerationEnd}
        onStoryGenerated={handleStoryGenerated}
      />

      <StoriesLibrary
        stories={stories}
        onStoriesChange={setStories}
        highlightedStoryIds={highlightedStoryIds}
        inbound={inbound}
        isFree={isFree}
        verified={verified}
        deletedCount={deletedCount}
        showDeletedBanner={showDeletedBanner}
        initialLibraryView={initialLibraryView}
      />
    </>
  );
}
