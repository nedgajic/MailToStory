import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Digest } from "@/lib/digest-schema";
import { BRAND_EXPORT_ATTRIBUTION, BRAND_NAME, BRAND_URL } from "@/lib/brand";
import {
  DIGEST_EXPORT_MONO,
  DIGEST_EXPORT_SERIF,
  DIGEST_STATUS_LABEL,
  DIGEST_STATUS_STYLE,
  formatActionItem,
  formatParticipant,
  formatSpeakerLabel,
  formatStoryMeta,
  formatTimelineMeta,
  proseBlocksForExport,
  proseExportParts,
  speakerPanelIndex,
} from "@/lib/digestExportContent";
import { DIGEST_EXPORT_THEME as T } from "@/lib/digestExportTheme";
import { displayUrlLabel } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";
import { resolveSpeakerToEmail } from "@/lib/speakerAvatar";

function monoRun(
  text: string,
  opts: {
    size?: number;
    bold?: boolean;
    color?: string;
    italics?: boolean;
    caps?: boolean;
    spacing?: number;
  } = {},
): TextRun {
  return new TextRun({
    text,
    font: DIGEST_EXPORT_MONO,
    size: opts.size ?? 16,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? T.proseSoft.replace("#", ""),
    allCaps: opts.caps,
    characterSpacing: opts.spacing,
  });
}

function serifRun(
  text: string,
  opts: {
    size?: number;
    bold?: boolean;
    color?: string;
    italics?: boolean;
  } = {},
): TextRun {
  return new TextRun({
    text,
    font: DIGEST_EXPORT_SERIF,
    size: opts.size ?? 22,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? T.prose.replace("#", ""),
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 260, after: 160 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: T.border.replace("#", ""),
        space: 1,
      },
    },
    children: [
      monoRun(text, {
        size: 13,
        caps: true,
        spacing: 28,
        color: T.muted.replace("#", ""),
      }),
    ],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ text: "" });
}

function speakerPanelTable(
  digest: Digest,
  speaker: string | undefined,
  children: Paragraph[],
): Table {
  const email = speaker?.trim()
    ? resolveSpeakerToEmail(speaker.trim(), digest.participants)
    : null;
  const idx = speakerPanelIndex(speaker, email);
  const fill =
    idx != null ? T.speakerBg[idx].replace("#", "") : T.pageBg.replace("#", "");
  const accent =
    idx != null ? T.speakerAccent[idx].replace("#", "") : T.border.replace("#", "");

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1.5, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: accent },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            children: [new Paragraph({ text: "" })],
          }),
          new TableCell({
            width: { size: 98.5, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
              right: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            children,
          }),
        ],
      }),
    ],
  });
}

export async function digestToDocxBuffer(digest: Digest): Promise<Buffer> {
  const parts: Array<Paragraph | Table> = [];
  const statusStyle = DIGEST_STATUS_STYLE[digest.status];

  parts.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        monoRun("Thread story", {
          size: 12,
          caps: true,
          spacing: 30,
          color: T.titleSub.replace("#", ""),
        }),
      ],
    }),
  );
  parts.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [serifRun(digest.title, { size: 44, color: T.title.replace("#", "") })],
    }),
  );
  parts.push(
    new Paragraph({
      spacing: { after: 280 },
      children: [monoRun(formatStoryMeta(digest), { size: 14, color: T.muted.replace("#", "") })],
    }),
  );

  parts.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1.2, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: T.recapRuleStrong.replace("#", "") },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [new Paragraph({ text: "" })],
            }),
            new TableCell({
              width: { size: 98.8, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: T.recapTint.replace("#", "") },
              margins: { top: 140, bottom: 140, left: 180, right: 120 },
              borders: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 6,
                  color: T.recapRule.replace("#", ""),
                },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [
                new Paragraph({
                  spacing: { after: 120 },
                  children: [
                    monoRun("Recap", {
                      size: 12,
                      bold: true,
                      caps: true,
                      spacing: 24,
                      color: T.copyFg.replace("#", ""),
                    }),
                    new TextRun({ text: "  " }),
                    new TextRun({
                      text: DIGEST_STATUS_LABEL[digest.status],
                      font: DIGEST_EXPORT_MONO,
                      size: 12,
                      bold: true,
                      color: statusStyle.labelColor,
                      shading: { type: ShadingType.CLEAR, fill: statusStyle.pillBg },
                      allCaps: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    serifRun(stripTrackingNoiseFromProse(digest.resolution_summary), {
                      size: 24,
                      color: T.recapSummary.replace("#", ""),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );
  parts.push(spacer());

  parts.push(sectionTitle("Story"));

  for (const block of proseBlocksForExport(digest.narrative)) {
    const speaker = formatSpeakerLabel(block.speaker, block.message_index);
    const { body, urls } = proseExportParts(block.content);
    const turnParts: Paragraph[] = [];

    if (speaker) {
      turnParts.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [monoRun(speaker, { size: 14, bold: true })],
        }),
      );
    }

    turnParts.push(
      new Paragraph({
        spacing: { after: urls.length > 0 ? 80 : 0 },
        alignment: AlignmentType.JUSTIFIED,
        children: [serifRun(body, { size: 23 })],
      }),
    );

    if (urls.length > 0) {
      turnParts.push(
        new Paragraph({
          spacing: { after: 60 },
          shading: { type: ShadingType.CLEAR, fill: T.surface2.replace("#", "") },
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
            left: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
            right: { style: BorderStyle.SINGLE, size: 4, color: T.border.replace("#", "") },
          },
          children: [
            monoRun("Links", {
              size: 11,
              bold: true,
              caps: true,
              spacing: 18,
              color: T.proseSofter.replace("#", ""),
            }),
          ],
        }),
      );
      for (const href of urls) {
        turnParts.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              monoRun(`↗ ${displayUrlLabel(href)}`, {
                size: 14,
                color: T.copyFg.replace("#", ""),
              }),
            ],
          }),
        );
      }
    }

    if (block.speaker?.trim()) {
      parts.push(speakerPanelTable(digest, block.speaker, turnParts));
    } else {
      parts.push(...turnParts);
    }
    parts.push(spacer());
  }

  parts.push(sectionTitle("Timeline"));
  if (digest.timeline.length === 0) {
    parts.push(
      new Paragraph({
        children: [serifRun("No timeline entries.", { italics: true, color: T.proseFaint.replace("#", "") })],
      }),
    );
  } else {
    for (const event of digest.timeline) {
      parts.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 8,
              color: T.timelineLine.replace("#", ""),
              space: 4,
            },
          },
          indent: { left: 220 },
          children: [
            monoRun(formatTimelineMeta(event), { size: 14, color: T.proseSofter.replace("#", "") }),
            new TextRun({ text: "", break: 1 }),
            serifRun(event.summary, { size: 21 }),
          ],
        }),
      );
    }
  }

  parts.push(sectionTitle("Action items"));
  if (digest.action_items.length === 0) {
    parts.push(
      new Paragraph({
        children: [serifRun("None.", { italics: true, color: T.proseFaint.replace("#", "") })],
      }),
    );
  } else {
    for (const item of digest.action_items) {
      parts.push(
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: [serifRun(formatActionItem(item), { size: 20 })],
        }),
      );
    }
  }

  parts.push(sectionTitle("Participants"));
  for (const participant of digest.participants) {
    parts.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [serifRun(formatParticipant(participant), { size: 20 })],
      }),
    );
  }

  parts.push(spacer());
  parts.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        monoRun(
          `${BRAND_NAME} · ${BRAND_URL.replace("https://", "")} · On-demand generation · Email remains in Google`,
          { size: 13, color: T.proseFaint.replace("#", "") },
        ),
      ],
    }),
  );
  parts.push(
    new Paragraph({
      spacing: { before: 120 },
      children: [
        serifRun(BRAND_EXPORT_ATTRIBUTION, {
          italics: true,
          color: T.proseFaint.replace("#", ""),
          size: 16,
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: BRAND_NAME,
    title: digest.title,
    sections: [{ children: parts }],
  });

  return Packer.toBuffer(doc);
}
