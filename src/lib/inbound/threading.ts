import type { PostmarkInboundPayload } from "@/lib/inbound/postmark";
import { headerValue } from "@/lib/inbound/postmark";

const SUBJECT_THREAD_WINDOW_MS = 72 * 60 * 60 * 1000;

export function subjectThreadWindowMs(): number {
  const parsed = Number(process.env.INBOUND_SUBJECT_THREAD_HOURS);
  if (!Number.isFinite(parsed) || parsed <= 0) return SUBJECT_THREAD_WINDOW_MS;
  return Math.floor(parsed) * 60 * 60 * 1000;
}

export function referencedMessageIds(payload: PostmarkInboundPayload): string[] {
  const refs = headerValue(payload, "References");
  if (!refs) return [];

  const bracketed = refs.match(/<[^>]+>/g);
  if (bracketed) {
    return [...new Set(bracketed.map((value) => value.slice(1, -1).trim()).filter(Boolean))];
  }

  return [...new Set(refs.split(/\s+/).map((value) => value.trim()).filter(Boolean))];
}

export function subjectThreadCutoff(from = new Date()): Date {
  return new Date(from.getTime() - subjectThreadWindowMs());
}
