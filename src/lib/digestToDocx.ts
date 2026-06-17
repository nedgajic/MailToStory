import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { Digest } from "@/lib/digest-schema";
import { proseMarkdownParts } from "@/lib/digestToMarkdown";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";

const STATUS_LABEL: Record<Digest["status"], string> = {
  resolved: "Resolved",
  ongoing: "Ongoing",
  pending_action: "Pending action",
  no_conclusion: "No conclusion",
};

export async function digestToDocxBuffer(digest: Digest): Promise<Buffer> {
  const parts: Paragraph[] = [];

  parts.push(
    new Paragraph({
      text: digest.title,
      heading: HeadingLevel.TITLE,
    }),
  );
  parts.push(new Paragraph({ text: "" }));

  parts.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Status: ", bold: true }),
        new TextRun(STATUS_LABEL[digest.status] ?? digest.status),
      ],
    }),
  );
  parts.push(new Paragraph({ text: "" }));

  parts.push(
    new Paragraph({
      text: "Recap",
      heading: HeadingLevel.HEADING_1,
    }),
  );
  parts.push(new Paragraph({ text: stripTrackingNoiseFromProse(digest.resolution_summary) }));
  parts.push(new Paragraph({ text: "" }));

  parts.push(
    new Paragraph({
      text: "Story",
      heading: HeadingLevel.HEADING_1,
    }),
  );

  for (let i = 0; i < digest.narrative.length; i++) {
    const block = digest.narrative[i];
    if (!block) continue;
    if (block.type === "prose") {
      const who = block.speaker?.trim();
      const idx =
        block.message_index != null
          ? ` (message ${block.message_index})`
          : "";
      if (who || idx) {
        const runs: TextRun[] = [];
        if (who) runs.push(new TextRun({ text: who, bold: true }));
        if (idx) runs.push(new TextRun({ text: idx, italics: true }));
        parts.push(new Paragraph({ children: runs }));
      }
      const { body, linkLines } = proseMarkdownParts(digest.narrative, i);
      parts.push(new Paragraph({ text: body }));
      for (const line of linkLines) {
        const t = line.startsWith("- ") ? line.slice(2) : line;
        parts.push(
          new Paragraph({
            text: t,
            bullet: { level: 0 },
          }),
        );
      }
      parts.push(new Paragraph({ text: "" }));
    } else {
      const who = block.speaker?.trim();
      const idx =
        block.message_index != null
          ? ` (message ${block.message_index})`
          : "";
      parts.push(
        new Paragraph({
          children: [
            new TextRun({ text: block.filename, bold: true }),
            new TextRun({
              text: `${who ? ` — ${who}` : ""}${idx}`,
              italics: true,
            }),
          ],
          bullet: { level: 0 },
        }),
      );
      parts.push(new Paragraph({ text: block.context }));
      parts.push(new Paragraph({ text: "" }));
    }
  }

  parts.push(
    new Paragraph({
      text: "Timeline",
      heading: HeadingLevel.HEADING_1,
    }),
  );
  if (digest.timeline.length === 0) {
    parts.push(
      new Paragraph({
        children: [
          new TextRun({ text: "No timeline entries.", italics: true }),
        ],
      }),
    );
    parts.push(new Paragraph({ text: "" }));
  } else {
    for (const ev of digest.timeline) {
      const idx =
        ev.message_index != null ? ` [msg ${ev.message_index}]` : "";
      parts.push(
        new Paragraph({
          text: `${ev.date} — ${ev.actor}${idx}: ${ev.summary}`,
          bullet: { level: 0 },
        }),
      );
    }
    parts.push(new Paragraph({ text: "" }));
  }

  parts.push(
    new Paragraph({
      text: "Action items",
      heading: HeadingLevel.HEADING_1,
    }),
  );
  if (digest.action_items.length === 0) {
    parts.push(
      new Paragraph({
        children: [new TextRun({ text: "None.", italics: true })],
      }),
    );
    parts.push(new Paragraph({ text: "" }));
  } else {
    for (const item of digest.action_items) {
      const owner = item.owner?.trim() || "Unassigned";
      const due = item.due?.trim() ? ` (due ${item.due})` : "";
      parts.push(
        new Paragraph({
          text: `${owner}${due}: ${item.action}`,
          bullet: { level: 0 },
        }),
      );
    }
    parts.push(new Paragraph({ text: "" }));
  }

  parts.push(
    new Paragraph({
      text: "Participants",
      heading: HeadingLevel.HEADING_1,
    }),
  );
  for (const p of digest.participants) {
    const mail = p.email?.trim() ? ` <${p.email}>` : "";
    parts.push(
      new Paragraph({
        text: `${p.name || p.email || "Unknown"}${mail} — ${p.role}`,
        bullet: { level: 0 },
      }),
    );
  }
  parts.push(new Paragraph({ text: "" }));

  parts.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Exported from Gmail Digest (generated content; verify against originals).",
          italics: true,
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "Gmail Digest",
    title: digest.title,
    sections: [
      {
        children: parts,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
