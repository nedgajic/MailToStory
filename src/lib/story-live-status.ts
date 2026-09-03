/** Conversations without a story are treated as actively generating for this long after the last message. */
export const STORY_GENERATING_WINDOW_MS = 4 * 60 * 1000;

export type PendingConversationLive = {
  id: string;
  subject: string;
  snippet: string;
  lastMessageAt: string;
};

export type StoryLiveSnapshot = {
  id: string;
  conversationId: string;
  title: string;
  subject: string;
  status: string;
  resolutionSummary: string;
  createdAt: string;
};

export type PendingConversationKind = "generating" | "stalled";

export function classifyPendingConversation(
  item: PendingConversationLive,
  nowMs = Date.now(),
): PendingConversationKind {
  const ageMs = nowMs - new Date(item.lastMessageAt).getTime();
  if (ageMs <= STORY_GENERATING_WINDOW_MS) return "generating";
  return "stalled";
}

export function splitPendingConversations(
  items: PendingConversationLive[],
  nowMs = Date.now(),
): { generating: PendingConversationLive[]; stalled: PendingConversationLive[] } {
  const generating: PendingConversationLive[] = [];
  const stalled: PendingConversationLive[] = [];
  for (const item of items) {
    if (classifyPendingConversation(item, nowMs) === "generating") {
      generating.push(item);
    } else {
      stalled.push(item);
    }
  }
  return { generating, stalled };
}

export type SimulatedGenerationPhase = {
  stepsDone: string[];
  statusLine: string;
  progressPct: number;
  indeterminate: boolean;
};

const GENERATION_PHASES = [
  { untilMs: 8_000, step: "Reading your thread", stepsDone: [] as string[] },
  {
    untilMs: 22_000,
    step: "Tidying signatures and quoted text",
    stepsDone: ["Reading your thread"],
  },
  {
    untilMs: Number.POSITIVE_INFINITY,
    step: "Writing your story",
    stepsDone: ["Reading your thread", "Tidying signatures and quoted text"],
  },
] as const;

export function simulatedGenerationPhase(
  startedAt: string,
  nowMs = Date.now(),
): SimulatedGenerationPhase {
  const elapsed = Math.max(0, nowMs - new Date(startedAt).getTime());
  const phase =
    GENERATION_PHASES.find((entry) => elapsed < entry.untilMs) ??
    GENERATION_PHASES[GENERATION_PHASES.length - 1];
  const progressPct = Math.min(92, Math.round((elapsed / 90_000) * 92));
  return {
    stepsDone: [...phase.stepsDone],
    statusLine: phase.step,
    progressPct,
    indeterminate: phase.stepsDone.length >= 2,
  };
}
