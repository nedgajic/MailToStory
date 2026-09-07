import type { AttachmentInfo, ThreadMetadata } from "@/lib/preprocessThread";
import {
  DEFAULT_STORY_LENGTH,
  type StoryLength,
} from "@/lib/story-length";

function lengthRules(length: StoryLength): string {
  switch (length) {
    case "concise":
      return `- STORY LENGTH (Concise): Keep the whole digest compact. resolution_summary: 1–2 sentences. Each narrative prose block: at most 1–2 short sentences. Merge adjacent turns from the same speaker into one block when the thread allows. Use fewer narrative blocks overall — summarize minor back-and-forth instead of narrating every message. Timeline summaries: one brief sentence each.`;
    case "elaborate":
      return `- STORY LENGTH (Elaborate): Write a fuller, richer digest. resolution_summary: 3–5 sentences covering context, key decisions, and open questions. Each narrative prose block: up to 6–8 sentences with concrete detail, nuance, and relevant quotes or paraphrases from the thread — but do not invent facts. Prefer separate blocks per meaningful turn rather than over-merging. Timeline summaries may be up to two sentences when helpful.`;
    default:
      return `- STORY LENGTH (Normal): resolution_summary: 2–3 sentences. Narrative prose blocks: a few flowing sentences each — magazine-style, not telegraphic, not overly long.`;
  }
}

export function buildDigestPrompt(
  cleanedThread: string,
  attachments: AttachmentInfo[],
  metadata: ThreadMetadata,
  length: StoryLength = DEFAULT_STORY_LENGTH,
): string {
  const participantList = metadata.participants
    .map((p) => `${p.name || "Unknown"} <${p.email}>`)
    .join(", ");

  const attachmentList =
    attachments.length > 0
      ? attachments
          .map(
            (a) =>
              `- "${a.filename}" (${a.mimeType}) — message index ${a.messageIndex + 1} (appeared in that message)`,
          )
          .join("\n")
      : "None";

  return `
Transform this email thread into a digest. Return ONLY valid JSON with no markdown fences, no backticks, no commentary.

THREAD METADATA:
Subject: ${metadata.subject}
Participants: ${participantList}
Date range: ${metadata.firstDate} to ${metadata.lastDate}
Total messages: ${metadata.messageCount}

ATTACHMENTS (filenames only — infer role from names and nearby text):
${attachmentList}

RAW THREAD (chronological):
${cleanedThread}

Return JSON with this exact shape and keys:

{
  "title": "short human-readable title",
  "resolution_summary": "summary of conclusion or current status (length per STORY LENGTH rules below)",
  "status": "resolved | ongoing | pending_action | no_conclusion",
  "narrative": [
    { "type": "prose", "content": "narrative paragraph", "speaker": "Name or omit if neutral", "message_index": 2 },
    { "type": "attachment_reference", "filename": "file.pdf", "context": "why it appeared here", "speaker": "optional", "message_index": 2 }
  ],
  "timeline": [
    { "date": "ISO 8601 UTC or best-effort parseable date-time string", "actor": "First name or short name", "summary": "one sentence", "message_index": 1 }
  ],
  "action_items": [
    { "owner": "name or null", "action": "description", "due": "YYYY-MM-DD or null" }
  ],
  "participants": [
    { "name": "full name", "email": "email if known else empty string", "role": "inferred role" }
  ]
}

Rules:
${lengthRules(length)}
- Do not invent facts. If unsure, prefer conservative wording.
- Narrative should read like a magazine article: flowing prose blocks, not bullet lists.
- Mix prose and attachment_reference blocks in chronological/story order; every attachment_reference filename must match one from ATTACHMENTS list when possible.
- LINKS: When a message contains http(s) or www. URLs, explain what was shared in plain language in the narrative; do not paste raw URL strings in the middle of a sentence. Still include each exact URL once in that prose block's \`content\` (e.g. at the end, space-separated) so the app can show link chips below the paragraph. Place each related \`attachment_reference\` immediately after its prose paragraph with the same \`message_index\`.
- SPEAKER: For each narrative block, include "speaker" with the participant person name (matching signatures, body text, or participants list) whose message that section is mainly about — not the organizational From label when a person's name appears in the thread. Omit speaker only for neutral framing. Same for attachment_reference when one sender is clear.
- NARRATIVE message_index: For every prose and attachment_reference block, set "message_index" to the integer N from the "[Message N | From: …]" line in RAW THREAD that is the primary source for that block. Use null only when the block is truly synthetic across several messages (rare).
- TIMELINE: Each timeline object must include "message_index": the integer N from the "[Message N | From: …]" line in RAW THREAD that best matches that beat. Use null only when no single message fits (e.g. synthesized summary across several).
- LANGUAGE: Use the same language as the majority of the email thread body for all human-readable strings (title, resolution_summary, every narrative prose and attachment context, timeline summaries, action descriptions, participant roles). If the thread mixes languages, use the dominant language. Keep JSON syntax and keys in English; only string values follow this rule.
`.trim();
}
