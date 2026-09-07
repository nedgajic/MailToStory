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
import { BRAND_EXPORT_ATTRIBUTION, BRAND_EXPORT_FOOTER, BRAND_NAME } from "@/lib/brand";
import {
  DIGEST_STATUS_LABEL,
  DIGEST_STATUS_STYLE,
  formatActionItem,
  formatParticipant,
  formatSpeakerLabel,
  formatStoryMeta,
  formatTimelineMeta,
  buildDigestParticipantColorMap,
  proseBlocksForExport,
  proseExportParts,
  speakerPanelIndex,
} from "@/lib/digestExportContent";
import {
  getDigestExportTheme,
  type DigestExportThemeConfig,
} from "@/lib/digestExportTheme";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import { displayUrlLabel } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";
import { resolveSpeakerToEmail } from "@/lib/speakerAvatar";

function hex(color: string): string {
  return color.replace("#", "");
}

function borderStyle(theme: DigestExportThemeConfig) {
  return theme.recapBorderStyle === "dashed"
    ? BorderStyle.DASHED
    : BorderStyle.SINGLE;
}

function createDocxBuilders(
  theme: DigestExportThemeConfig,
  colorMap: Map<string, number>,
) {
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
      font: theme.monoFont,
      size: opts.size ?? 16,
      bold: opts.bold,
      italics: opts.italics,
      color: opts.color ?? hex(theme.proseSoft),
      allCaps: opts.caps ?? theme.speakerCaps,
      characterSpacing: opts.spacing ?? theme.speakerLetterSpacing * 10,
    });
  }

  function serifRun(
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: string;
      italics?: boolean;
      caps?: boolean;
    } = {},
  ): TextRun {
    return new TextRun({
      text,
      font: theme.serifFont,
      size: opts.size ?? Math.round(theme.proseSize * 2),
      bold: opts.bold,
      italics: opts.italics ?? theme.titleItalic,
      allCaps: opts.caps ?? false,
      color: opts.color ?? hex(theme.prose),
    });
  }

  function sectionTitle(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 260, after: 160 },
      border: {
        bottom: {
          style: borderStyle(theme),
          size: 6,
          color: hex(theme.border),
          space: 1,
        },
      },
      children: [
        monoRun(text, {
          size: 13,
          caps: true,
          spacing: theme.sectionLetterSpacing * 10,
          color: hex(theme.muted),
        }),
      ],
    });
  }

  function speakerPanelTable(
    digest: Digest,
    speaker: string | undefined,
    children: Paragraph[],
  ): Table {
    const email = speaker?.trim()
      ? resolveSpeakerToEmail(speaker.trim(), digest.participants)
      : null;
    const idx = speakerPanelIndex(speaker, email, digest.participants, colorMap);
    const fill =
      idx != null ? hex(theme.speakerBg[idx]) : hex(theme.pageBg);
    const accent =
      idx != null ? hex(theme.speakerAccent[idx]) : hex(theme.border);
    const useRight =
      theme.panelUseRightAccent && idx != null && idx % 2 === 1;
    const edgeStyle = borderStyle(theme);

    const accentCell = new TableCell({
      width: { size: 1.5, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: accent },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      children: [new Paragraph({ text: "" })],
    });

    const contentCell = new TableCell({
      width: { size: 98.5, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      borders: {
        top: { style: edgeStyle, size: 4, color: hex(theme.border) },
        bottom: { style: edgeStyle, size: 4, color: hex(theme.border) },
        right: { style: edgeStyle, size: 4, color: hex(theme.border) },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      children,
    });

    if (theme.panelBorderLeftWidth === 0) {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [contentCell],
          }),
        ],
      });
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: useRight ? [contentCell, accentCell] : [accentCell, contentCell],
        }),
      ],
    });
  }

  return { monoRun, serifRun, sectionTitle, speakerPanelTable };
}

function spacer(): Paragraph {
  return new Paragraph({ text: "" });
}

export async function digestToDocxBuffer(
  digest: Digest,
  displayTheme: StoryDisplayTheme = "dossier",
  colorMode: StoryColorMode = "light",
): Promise<Buffer> {
  const theme = getDigestExportTheme(displayTheme, colorMode);
  const participantColorMap = buildDigestParticipantColorMap(
    digest,
    displayTheme,
    colorMode,
  );
  const { monoRun, serifRun, sectionTitle, speakerPanelTable } =
    createDocxBuilders(theme, participantColorMap);
  const parts: Array<Paragraph | Table> = [];
  const statusStyle = DIGEST_STATUS_STYLE[digest.status];
  const edgeStyle = borderStyle(theme);

  parts.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        serifRun(digest.title, {
          size: Math.round(theme.titleSize * 2),
          color: hex(theme.title),
          italics: theme.titleItalic,
          caps: theme.titleUppercase,
        }),
      ],
    }),
  );
  parts.push(
    new Paragraph({
      spacing: { after: 280 },
      children: [monoRun(formatStoryMeta(digest), { size: 14, color: hex(theme.muted) })],
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
              shading: { type: ShadingType.CLEAR, fill: hex(theme.recapRuleStrong) },
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
              shading: { type: ShadingType.CLEAR, fill: hex(theme.recapTint) },
              margins: { top: 140, bottom: 140, left: 180, right: 120 },
              borders: {
                top: {
                  style: edgeStyle,
                  size: 6,
                  color: hex(theme.recapRule),
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
                      spacing: theme.sectionLetterSpacing * 10,
                      color: hex(theme.copyFg),
                    }),
                    new TextRun({ text: "  " }),
                    new TextRun({
                      text: DIGEST_STATUS_LABEL[digest.status],
                      font: theme.monoFont,
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
                      size: Math.round(theme.recapSize * 2),
                      color: hex(theme.recapSummary),
                      italics: theme.recapItalic,
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
    const email = block.speaker?.trim()
      ? resolveSpeakerToEmail(block.speaker.trim(), digest.participants)
      : null;
    const colorIdx = speakerPanelIndex(
      block.speaker,
      email,
      digest.participants,
      participantColorMap,
    );
    const { body, urls } = proseExportParts(block.content);
    const turnParts: Paragraph[] = [];

    if (speaker) {
      turnParts.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            monoRun(speaker, {
              size: 14,
              bold: true,
              color:
                colorIdx != null
                  ? hex(theme.speakerAccent[colorIdx])
                  : undefined,
            }),
          ],
        }),
      );
    }

    turnParts.push(
      new Paragraph({
        spacing: { after: urls.length > 0 ? 80 : 0 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
          serifRun(body, {
            size: Math.round(theme.proseSize * 2),
            italics: theme.titleItalic && displayTheme === "moonletter",
          }),
        ],
      }),
    );

    if (urls.length > 0) {
      turnParts.push(
        new Paragraph({
          spacing: { after: 60 },
          shading: { type: ShadingType.CLEAR, fill: hex(theme.surface2) },
          border: {
            top: { style: edgeStyle, size: 4, color: hex(theme.border) },
            bottom: { style: edgeStyle, size: 4, color: hex(theme.border) },
            left: { style: edgeStyle, size: 4, color: hex(theme.border) },
            right: { style: edgeStyle, size: 4, color: hex(theme.border) },
          },
          children: [
            monoRun("Links", {
              size: 11,
              bold: true,
              caps: true,
              spacing: theme.sectionLetterSpacing * 10,
              color: hex(theme.proseSofter),
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
                color: hex(theme.copyFg),
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
        children: [
          serifRun("No timeline entries.", {
            italics: true,
            color: hex(theme.proseFaint),
          }),
        ],
      }),
    );
  } else {
    for (const event of digest.timeline) {
      parts.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          border: {
            left: {
              style: edgeStyle,
              size: 8,
              color: hex(theme.timelineLine),
              space: 4,
            },
          },
          indent: { left: 220 },
          children: [
            monoRun(formatTimelineMeta(event), {
              size: 14,
              color: hex(theme.proseSofter),
            }),
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
        children: [
          serifRun("None.", { italics: true, color: hex(theme.proseFaint) }),
        ],
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
      children: [monoRun(BRAND_EXPORT_FOOTER, { size: 13, color: hex(theme.proseFaint) })],
    }),
  );
  parts.push(
    new Paragraph({
      spacing: { before: 120 },
      children: [
        serifRun(BRAND_EXPORT_ATTRIBUTION, {
          italics: true,
          color: hex(theme.proseFaint),
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
