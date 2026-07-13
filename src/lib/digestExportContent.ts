import type { Digest, NarrativeBlock } from "@/lib/digest-schema";
import { extractUrlsFromText, stripUrlsFromText } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";

export const DIGEST_STATUS_LABEL: Record<Digest["status"], string> = {
  resolved: "Resolved",
  ongoing: "Ongoing",
  pending_action: "Pending Action",
  no_conclusion: "No Conclusion",
};

export const DIGEST_STATUS_STYLE: Record<
  Digest["status"],
  { labelColor: string; pillBg: string }
> = {
  resolved: { labelColor: "2D6A4F", pillBg: "D8F3DC" },
  ongoing: { labelColor: "7B4F12", pillBg: "FDE8C8" },
  pending_action: { labelColor: "1D3557", pillBg: "D6E8F7" },
  no_conclusion: { labelColor: "555555", pillBg: "EEEEEE" },
};

export const DIGEST_EXPORT_SERIF = "Lora";
export const DIGEST_EXPORT_MONO = "DM Mono";

export type ProseBlock = Extract<NarrativeBlock, { type: "prose" }>;

/** PDF and Word exports include prose only — no attachment references. */
export function proseBlocksForExport(
  narrative: Digest["narrative"],
): ProseBlock[] {
  return narrative.filter((block): block is ProseBlock => block.type === "prose");
}

export function proseExportParts(content: string): {
  body: string;
  urls: string[];
} {
  const urls = extractUrlsFromText(content);
  const readable = stripTrackingNoiseFromProse(content);
  const body = urls.length > 0 ? stripUrlsFromText(readable) : readable;
  return { body, urls };
}

export function formatStoryMeta(digest: Digest): string {
  const parts = [`${digest.participants.length} participants`];
  if (digest.timeline.length > 0) {
    parts.push(`${digest.timeline.length} timeline beats`);
    const first = digest.timeline[0];
    const last = digest.timeline[digest.timeline.length - 1];
    if (first && last) {
      const fmt = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      };
      parts.push(`${fmt(first.date)} – ${fmt(last.date)}`);
    }
  }
  return parts.join(" · ");
}

/** @deprecated Prefer formatStoryMeta to match on-page story header. */
export function formatExportMeta(digest: Digest, generatedAt = new Date()): string {
  const generated = generatedAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${formatStoryMeta(digest)} · ${generated}`;
}

export function speakerPanelIndex(
  speaker: string | undefined,
  email: string | null,
): number | null {
  const who = speaker?.trim();
  if (!who) return null;
  const key = (email || who).trim();
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 33 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 5;
}

export function formatSpeakerLabel(
  speaker: string | undefined,
  messageIndex: number | null | undefined,
): string {
  const who = speaker?.trim();
  if (!who) {
    return messageIndex != null ? `message ${messageIndex}` : "";
  }
  return messageIndex != null ? `${who} · message ${messageIndex}` : who;
}

export function formatTimelineMeta(
  event: Digest["timeline"][number],
): string {
  const msg = event.message_index != null ? ` · msg ${event.message_index}` : "";
  return `${event.date} · ${event.actor}${msg}`;
}

export function formatActionItem(
  item: Digest["action_items"][number],
): string {
  let text = item.action;
  if (item.owner != null && item.owner !== "") {
    text += ` (${item.owner})`;
  }
  if (item.due != null && item.due !== "") {
    text += ` — due ${item.due}`;
  }
  return text;
}

export function formatParticipant(
  participant: Digest["participants"][number],
): string {
  const name = participant.name || participant.email;
  const mail = participant.email?.trim() ? ` <${participant.email}>` : "";
  return `${name}${mail} — ${participant.role}`;
}
