import type { Digest } from "@/lib/digest-schema";
import { BRAND_EXPORT_ATTRIBUTION } from "@/lib/brand";
import { extractUrlsFromText, stripUrlsFromText } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";

const STATUS_LABEL: Record<Digest["status"], string> = {
  resolved: "Resolved",
  ongoing: "Ongoing",
  pending_action: "Pending action",
  no_conclusion: "No conclusion",
};

/** Match story UI: strip inline URLs from prose when links or bundled attachments are shown separately. */
export function proseMarkdownParts(
  narrative: Digest["narrative"],
  index: number,
): { body: string; linkLines: string[] } {
  const block = narrative[index];
  if (!block || block.type !== "prose") {
    return { body: "", linkLines: [] };
  }
  const urls = extractUrlsFromText(block.content);
  const readable = stripTrackingNoiseFromProse(block.content);
  let attachmentCount = 0;
  if (block.message_index != null) {
    let j = index + 1;
    while (j < narrative.length) {
      const n = narrative[j];
      if (!n || n.type !== "attachment_reference") break;
      if (n.message_index !== block.message_index) break;
      attachmentCount += 1;
      j += 1;
    }
  }
  const strip = urls.length > 0 || attachmentCount > 0;
  const body = strip ? stripUrlsFromText(readable) : readable;
  const linkLines =
    strip && urls.length > 0 ? urls.map((u) => `- ${u}`) : [];
  return { body, linkLines };
}

/** Plain Markdown export for clipboard / files. */
export function digestToMarkdown(digest: Digest): string {
  const lines: string[] = [];

  lines.push(`# ${digest.title}`, "");
  lines.push(
    `**Status:** ${STATUS_LABEL[digest.status] ?? digest.status}`,
    "",
  );
  lines.push("## Recap", "", stripTrackingNoiseFromProse(digest.resolution_summary), "");
  lines.push("## Story", "");

  for (let i = 0; i < digest.narrative.length; i++) {
    const block = digest.narrative[i];
    if (!block) continue;
    if (block.type === "prose") {
      const who = block.speaker?.trim();
      const idx =
        block.message_index != null
          ? ` _(message ${block.message_index})_`
          : "";
      if (who) lines.push(`**${who}**${idx}`, "");
      else if (idx) lines.push(idx.trim(), "");
      const { body, linkLines } = proseMarkdownParts(digest.narrative, i);
      lines.push(body, "");
      if (linkLines.length > 0) {
        lines.push(...linkLines, "");
      }
    } else {
      const who = block.speaker?.trim();
      const idx =
        block.message_index != null
          ? ` _(message ${block.message_index})_`
          : "";
      lines.push(
        `- **${block.filename}**${who ? ` — _${who}_` : ""}${idx}`,
        `  ${block.context}`,
        "",
      );
    }
  }

  lines.push("## Timeline", "");
  if (digest.timeline.length === 0) {
    lines.push("_No timeline entries._", "");
  } else {
    for (const ev of digest.timeline) {
      const idx =
        ev.message_index != null ? ` [msg ${ev.message_index}]` : "";
      lines.push(
        `- **${ev.date}** — **${ev.actor}**${idx}: ${ev.summary}`,
      );
    }
    lines.push("");
  }

  lines.push("## Action items", "");
  if (digest.action_items.length === 0) {
    lines.push("_None._", "");
  } else {
    for (const item of digest.action_items) {
      const owner = item.owner?.trim() || "_Unassigned_";
      const due = item.due?.trim() ? ` (due ${item.due})` : "";
      lines.push(`- [ ] **${owner}**${due}: ${item.action}`);
    }
    lines.push("");
  }

  lines.push("## Participants", "");
  for (const p of digest.participants) {
    const mail = p.email?.trim() ? ` <${p.email}>` : "";
    lines.push(`- **${p.name || p.email || "Unknown"}**${mail} — ${p.role}`);
  }
  lines.push("");

  lines.push(
    "---",
    `_${BRAND_EXPORT_ATTRIBUTION}_`,
  );

  return lines.join("\n");
}
