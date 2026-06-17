import { z } from "zod";

export const digestStatusSchema = z.enum([
  "resolved",
  "ongoing",
  "pending_action",
  "no_conclusion",
]);

const proseBlock = z.object({
  type: z.literal("prose"),
  content: z.string(),
  /** Participant name (or From-style label) this section mainly reflects; omit for neutral/thread-voice. */
  speaker: z.string().optional(),
  /** 1-based index matching [Message N | …] in RAW THREAD for this paragraph's source message. */
  message_index: z.number().int().min(1).optional().nullable(),
});

const attachmentBlock = z.object({
  type: z.literal("attachment_reference"),
  filename: z.string(),
  context: z.string(),
  speaker: z.string().optional(),
  message_index: z.number().int().min(1).optional().nullable(),
});

export const narrativeBlockSchema = z.discriminatedUnion("type", [
  proseBlock,
  attachmentBlock,
]);

export const digestSchema = z.object({
  title: z.string(),
  resolution_summary: z.string(),
  status: digestStatusSchema,
  narrative: z.array(narrativeBlockSchema),
  timeline: z.array(
    z.object({
      date: z.string(),
      actor: z.string(),
      summary: z.string(),
      /** 1-based index matching [Message N | …] lines in the raw thread; omit or null if not tied to one message. */
      message_index: z.number().int().min(1).optional().nullable(),
    }),
  ),
  action_items: z.array(
    z.object({
      owner: z.string().nullable(),
      action: z.string(),
      due: z.string().nullable(),
    }),
  ),
  participants: z.array(
    z.object({
      name: z.string(),
      email: z.string(),
      role: z.string(),
    }),
  ),
});

export type Digest = z.infer<typeof digestSchema>;
export type NarrativeBlock = z.infer<typeof narrativeBlockSchema>;
