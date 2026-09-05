import type { Digest } from "@/lib/digest-schema";

export function resolveGmailMessageId(
  messageIndex: number | null | undefined,
  messageIdsInOrder: string[],
): string | null {
  if (messageIndex == null || messageIndex < 1) return null;
  const id = messageIdsInOrder[messageIndex - 1];
  return id?.trim() ? id : null;
}

/** First timeline beat per actor (lowercase name) → message_index. */
export function buildActorMessageIndexMap(
  timeline: Digest["timeline"],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const event of timeline) {
    const actor = event.actor?.trim();
    if (!actor || event.message_index == null) continue;
    const key = actor.toLowerCase();
    if (!map.has(key)) map.set(key, event.message_index);
  }
  return map;
}

function resolveFromSpeaker(
  speaker: string | undefined,
  actorMessageMap: Map<string, number>,
  messageIdsInOrder: string[],
): string | null {
  const who = speaker?.trim();
  if (!who) return null;
  const lower = who.toLowerCase();

  const direct = actorMessageMap.get(lower);
  if (direct != null) {
    const id = resolveGmailMessageId(direct, messageIdsInOrder);
    if (id) return id;
  }

  const first = lower.split(/\s+/)[0] ?? "";
  for (const [actor, messageIndex] of actorMessageMap) {
    if (first && (actor === first || actor.startsWith(`${first} `))) {
      const id = resolveGmailMessageId(messageIndex, messageIdsInOrder);
      if (id) return id;
    }
  }

  return null;
}

/** Resolve which stored message opens for a story turn. */
export function resolveTurnSourceMessageId(input: {
  messageIndex?: number | null;
  speaker?: string | null;
  messageIdsInOrder: string[];
  turnIndex: number;
  actorMessageMap?: Map<string, number>;
}): string | null {
  const {
    messageIndex,
    speaker,
    messageIdsInOrder,
    turnIndex,
    actorMessageMap,
  } = input;

  if (!messageIdsInOrder.length) return null;

  const fromDigest = resolveGmailMessageId(messageIndex ?? null, messageIdsInOrder);
  if (fromDigest) return fromDigest;

  if (messageIndex != null && messageIndex >= 1) {
    return `src-${messageIndex}`;
  }

  if (actorMessageMap && actorMessageMap.size > 0) {
    const fromSpeaker = resolveFromSpeaker(
      speaker ?? undefined,
      actorMessageMap,
      messageIdsInOrder,
    );
    if (fromSpeaker) return fromSpeaker;
  }

  const fallbackIndex = turnIndex + 1;
  if (fallbackIndex >= 1 && fallbackIndex <= messageIdsInOrder.length) {
    return resolveGmailMessageId(fallbackIndex, messageIdsInOrder);
  }

  return null;
}
