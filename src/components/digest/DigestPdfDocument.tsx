import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { Digest } from "@/lib/digest-schema";
import { BRAND_EXPORT_FOOTER, BRAND_NAME } from "@/lib/brand";
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
  type ProseBlock,
} from "@/lib/digestExportContent";
import {
  exportStatusPillBorderRadius,
  getDigestExportTheme,
  pdfBorderRadius,
  type DigestExportThemeConfig,
} from "@/lib/digestExportTheme";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import { displayUrlLabel } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";
import { resolveSpeakerToEmail } from "@/lib/speakerAvatar";

function speakerPanelPdf(
  theme: DigestExportThemeConfig,
  speaker: string | null | undefined,
  emailForHue: string | null,
  participants: Digest["participants"],
  colorMap: Map<string, number>,
): {
  backgroundColor: string;
  borderLeftColor?: string;
  borderLeftWidth?: number;
  borderRightColor?: string;
  borderRightWidth?: number;
  borderWidth?: number;
  borderColor?: string;
  paddingLeft: number;
  paddingVertical: number;
  paddingRight: number;
  marginBottom: number;
  borderRadius: number;
} | null {
  const idx = speakerPanelIndex(speaker, emailForHue, participants, colorMap);
  if (idx == null) return null;

  const base = {
    backgroundColor: theme.speakerBg[idx],
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 9,
    marginBottom: 12,
    ...pdfBorderRadius(theme.panelBorderRadius),
  };

  if (theme.panelBorderLeftWidth === 0) {
    return {
      ...base,
      borderWidth: 1,
      borderColor: theme.border,
    };
  }

  if (theme.panelUseRightAccent && idx % 2 === 1) {
    return {
      ...base,
      borderRightColor: theme.speakerAccent[idx],
      borderRightWidth: theme.panelBorderLeftWidth,
    };
  }

  return {
    ...base,
    borderLeftColor: theme.speakerAccent[idx],
    borderLeftWidth: theme.panelBorderLeftWidth,
  };
}

function recapPanelBorderStyle(theme: DigestExportThemeConfig) {
  const edgeStyle = theme.recapBorderStyle;
  const edgeColor = theme.borderStrong;
  const width = theme.recapBorderWidth;

  if (theme.recapBorderLeftAccentWidth > 0) {
    return {
      borderStyle: edgeStyle,
      borderTopWidth: width,
      borderRightWidth: width,
      borderBottomWidth: width,
      borderLeftWidth: theme.recapBorderLeftAccentWidth,
      borderTopColor: edgeColor,
      borderRightColor: edgeColor,
      borderBottomColor: edgeColor,
      borderLeftColor: theme.copyFg,
    };
  }

  return {
    borderStyle: edgeStyle,
    borderWidth: width,
    borderColor: edgeColor,
  };
}

function createPdfStyles(theme: DigestExportThemeConfig) {
  const statusPillRadius = exportStatusPillBorderRadius(theme.recapBorderRadius);

  return StyleSheet.create({
    page: {
      paddingTop: 42,
      paddingBottom: 48,
      paddingHorizontal: 44,
      fontFamily: theme.serifFont,
      fontSize: 10.5,
      lineHeight: 1.5,
      color: theme.prose,
      backgroundColor: theme.pageBg,
    },
    title: {
      fontSize: theme.titleSize,
      fontFamily: theme.serifFont,
      fontWeight: "normal",
      fontStyle: theme.titleItalic ? "italic" : "normal",
      textTransform: theme.titleUppercase ? "uppercase" : "none",
      marginBottom: 8,
      color: theme.title,
      lineHeight: 1.25,
      letterSpacing: theme.titleUppercase ? 0.8 : 0,
    },
    meta: {
      fontFamily: theme.monoFont,
      fontSize: 8,
      color: theme.muted,
      letterSpacing: 0.4,
      marginBottom: 18,
    },
    sectionTitle: {
      fontFamily: theme.monoFont,
      fontSize: 7.5,
      letterSpacing: theme.sectionLetterSpacing,
      color: theme.muted,
      textTransform: "uppercase",
      marginTop: 14,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    recapPanel: {
      marginBottom: 16,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 12,
      paddingRight: 12,
      ...recapPanelBorderStyle(theme),
      backgroundColor: theme.recapTint,
      ...pdfBorderRadius(theme.recapBorderRadius),
    },
    recapMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 9,
    },
    recapKicker: {
      fontFamily: theme.monoFont,
      fontWeight: "bold",
      fontSize: 7.2,
      color: theme.copyFg,
      textTransform: "uppercase",
      letterSpacing: theme.sectionLetterSpacing,
    },
    recapPillText: {
      fontFamily: theme.monoFont,
      fontWeight: "bold",
      fontSize: 7.2,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: statusPillRadius,
    },
    recapBody: {
      fontFamily: theme.serifFont,
      fontSize: theme.recapSize,
      lineHeight: 1.72,
      color: theme.recapSummary,
      fontStyle: theme.recapItalic ? "italic" : "normal",
    },
    speaker: {
      fontFamily: theme.monoFont,
      fontWeight: "bold",
      fontSize: 7,
      color: theme.proseSoft,
      marginBottom: 5,
      letterSpacing: theme.speakerLetterSpacing,
      textTransform: theme.speakerCaps ? "uppercase" : "none",
    },
    prose: {
      fontFamily: theme.serifFont,
      fontSize: theme.proseSize,
      lineHeight: theme.proseLineHeight,
      marginBottom: 2,
      color: theme.prose,
      fontStyle: theme.titleItalic ? "italic" : "normal",
    },
    resourcesBox: {
      marginTop: 8,
      marginBottom: 4,
      paddingVertical: 7,
      paddingHorizontal: 8,
      backgroundColor: theme.surface2,
      borderWidth: 1,
      borderColor: theme.border,
      ...pdfBorderRadius(theme.panelBorderRadius),
    },
    resourcesLabel: {
      fontFamily: theme.monoFont,
      fontWeight: "bold",
      fontSize: 6.8,
      letterSpacing: theme.sectionLetterSpacing,
      color: theme.proseSofter,
      textTransform: "uppercase",
      marginBottom: 5,
    },
    linkRow: { marginBottom: 3 },
    linkText: {
      fontFamily: theme.monoFont,
      fontSize: 7.8,
      color: theme.copyFg,
    },
    timelineBlock: {
      marginBottom: 10,
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderLeftColor: theme.timelineLine,
    },
    timelineMeta: {
      fontFamily: theme.monoFont,
      fontSize: 7.5,
      color: theme.proseSofter,
      marginBottom: 3,
      textTransform: theme.speakerCaps ? "uppercase" : "none",
    },
    timelineSummary: {
      fontFamily: theme.serifFont,
      fontSize: 10.5,
      lineHeight: 1.55,
    },
    actionRow: { flexDirection: "row", marginBottom: 5 },
    actionBullet: { width: 12, fontSize: 10 },
    actionText: {
      flex: 1,
      fontFamily: theme.serifFont,
      fontSize: 10.2,
      lineHeight: 1.45,
    },
    participantLine: {
      marginBottom: 4,
      fontFamily: theme.serifFont,
      fontSize: 9.8,
    },
    muted: {
      fontFamily: theme.serifFont,
      fontStyle: "italic",
      fontSize: 10,
      color: theme.proseFaint,
    },
    footer: {
      position: "absolute",
      bottom: 22,
      left: 44,
      right: 44,
      fontFamily: theme.monoFont,
      fontSize: 7.3,
      color: theme.proseFaint,
      textAlign: "center",
    },
  });
}

type Props = {
  digest: Digest;
  displayTheme?: StoryDisplayTheme;
  colorMode?: StoryColorMode;
};

function PdfLinkList({
  urls,
  styles,
}: {
  urls: string[];
  styles: ReturnType<typeof createPdfStyles>;
}) {
  if (urls.length === 0) return null;

  return (
    <View style={styles.resourcesBox}>
      <Text style={styles.resourcesLabel}>Links</Text>
      {urls.map((href) => (
        <View key={href} style={styles.linkRow} wrap={false}>
          <Link src={href}>
            <Text style={styles.linkText}>↗ {displayUrlLabel(href)}</Text>
          </Link>
        </View>
      ))}
    </View>
  );
}

function ProsePdfBlock({
  block,
  participants,
  theme,
  styles,
  colorMap,
}: {
  block: ProseBlock;
  participants: Digest["participants"];
  theme: DigestExportThemeConfig;
  styles: ReturnType<typeof createPdfStyles>;
  colorMap: Map<string, number>;
}) {
  const who = block.speaker?.trim();
  const email = who ? resolveSpeakerToEmail(who, participants) : null;
  const colorIdx = speakerPanelIndex(block.speaker, email, participants, colorMap);
  const panel = speakerPanelPdf(theme, block.speaker, email, participants, colorMap);
  const { body, urls } = proseExportParts(block.content);
  const speaker = formatSpeakerLabel(block.speaker, block.message_index);

  const content = (
    <>
      {speaker ? (
        <Text
          style={[
            styles.speaker,
            ...(colorIdx != null
              ? [{ color: theme.speakerAccent[colorIdx] }]
              : []),
          ]}
        >
          {speaker}
        </Text>
      ) : null}
      <Text style={styles.prose}>{body}</Text>
      <PdfLinkList urls={urls} styles={styles} />
    </>
  );

  if (panel) {
    return <View style={panel}>{content}</View>;
  }
  return <View style={{ marginBottom: 12 }}>{content}</View>;
}

export function DigestPdfDocument({
  digest,
  displayTheme = "dossier",
  colorMode = "light",
}: Props) {
  const theme = getDigestExportTheme(displayTheme, colorMode);
  const styles = createPdfStyles(theme);
  const participantColorMap = buildDigestParticipantColorMap(
    digest,
    displayTheme,
    colorMode,
  );
  const statusStyle = DIGEST_STATUS_STYLE[digest.status];

  return (
    <Document
      title={digest.title}
      author={BRAND_NAME}
      subject={stripTrackingNoiseFromProse(digest.resolution_summary).slice(0, 180)}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{digest.title}</Text>
        <Text style={styles.meta}>{formatStoryMeta(digest)}</Text>

        <View style={styles.recapPanel} wrap={false}>
          <View style={styles.recapMetaRow}>
            <Text style={styles.recapKicker}>Recap</Text>
            <Text
              style={[
                styles.recapPillText,
                {
                  color: `#${statusStyle.labelColor}`,
                  backgroundColor: `#${statusStyle.pillBg}`,
                },
              ]}
            >
              {DIGEST_STATUS_LABEL[digest.status]}
            </Text>
          </View>
          <Text style={styles.recapBody}>
            {stripTrackingNoiseFromProse(digest.resolution_summary)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Story</Text>
        {proseBlocksForExport(digest.narrative).map((block, i) => (
          <ProsePdfBlock
            key={`${block.message_index ?? "x"}-${String(i)}`}
            block={block}
            participants={digest.participants}
            theme={theme}
            styles={styles}
            colorMap={participantColorMap}
          />
        ))}

        <Text style={styles.sectionTitle}>Timeline</Text>
        {digest.timeline.length === 0 ? (
          <Text style={styles.muted}>No timeline entries.</Text>
        ) : (
          digest.timeline.map((event, i) => (
            <View key={i} style={styles.timelineBlock} wrap={false}>
              <Text style={styles.timelineMeta}>{formatTimelineMeta(event)}</Text>
              <Text style={styles.timelineSummary}>{event.summary}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Action items</Text>
        {digest.action_items.length === 0 ? (
          <Text style={styles.muted}>None.</Text>
        ) : (
          digest.action_items.map((item, i) => (
            <View key={i} style={styles.actionRow} wrap={false}>
              <Text style={styles.actionBullet}>•</Text>
              <Text style={styles.actionText}>{formatActionItem(item)}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Participants</Text>
        {digest.participants.map((participant, i) => (
          <Text key={i} style={styles.participantLine}>
            {formatParticipant(participant)}
          </Text>
        ))}

        <Text style={styles.footer} fixed>
          {BRAND_EXPORT_FOOTER}
        </Text>
      </Page>
    </Document>
  );
}
