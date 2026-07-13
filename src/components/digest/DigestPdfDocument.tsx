import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { Digest } from "@/lib/digest-schema";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
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
  type ProseBlock,
} from "@/lib/digestExportContent";
import { DIGEST_EXPORT_THEME as T } from "@/lib/digestExportTheme";
import { displayUrlLabel } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";
import { resolveSpeakerToEmail } from "@/lib/speakerAvatar";

function speakerPanelPdf(
  speaker: string | undefined,
  emailForHue: string | null,
): {
  backgroundColor: string;
  borderLeftColor: string;
  borderLeftWidth: number;
  paddingLeft: number;
  paddingVertical: number;
  paddingRight: number;
  marginBottom: number;
  borderRadius: number;
} | null {
  const idx = speakerPanelIndex(speaker, emailForHue);
  if (idx == null) return null;
  return {
    backgroundColor: T.speakerBg[idx],
    borderLeftColor: T.speakerAccent[idx],
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 9,
    marginBottom: 12,
    borderRadius: 8,
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: DIGEST_EXPORT_SERIF,
    fontSize: 10.5,
    lineHeight: 1.5,
    color: T.prose,
    backgroundColor: T.pageBg,
  },
  kicker: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: T.titleSub,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontFamily: DIGEST_EXPORT_SERIF,
    fontWeight: "normal",
    marginBottom: 8,
    color: T.title,
    lineHeight: 1.25,
  },
  meta: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontSize: 8,
    color: T.muted,
    letterSpacing: 0.4,
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontSize: 7.5,
    letterSpacing: 1.6,
    color: T.muted,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  recapPanel: {
    marginBottom: 16,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 4,
    borderTopWidth: 1,
    borderTopColor: T.recapRule,
    borderLeftWidth: 1,
    borderLeftColor: T.recapRuleStrong,
    backgroundColor: T.recapTint,
  },
  recapMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  recapKicker: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontWeight: "bold",
    fontSize: 7.2,
    color: T.copyFg,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  recapPillText: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontWeight: "bold",
    fontSize: 7.2,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  recapBody: {
    fontFamily: DIGEST_EXPORT_SERIF,
    fontSize: 12,
    lineHeight: 1.72,
    color: T.recapSummary,
  },
  speaker: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontWeight: "bold",
    fontSize: 7,
    color: T.proseSoft,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  prose: {
    fontFamily: DIGEST_EXPORT_SERIF,
    fontSize: 11.5,
    lineHeight: 1.85,
    marginBottom: 2,
    color: T.prose,
  },
  resourcesBox: {
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 6,
  },
  resourcesLabel: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontWeight: "bold",
    fontSize: 6.8,
    letterSpacing: 1.3,
    color: T.proseSofter,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  linkRow: { marginBottom: 3 },
  linkText: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontSize: 7.8,
    color: T.copyFg,
  },
  timelineBlock: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: T.timelineLine,
  },
  timelineMeta: {
    fontFamily: DIGEST_EXPORT_MONO,
    fontSize: 7.5,
    color: T.proseSofter,
    marginBottom: 3,
  },
  timelineSummary: {
    fontFamily: DIGEST_EXPORT_SERIF,
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  actionRow: { flexDirection: "row", marginBottom: 5 },
  actionBullet: { width: 12, fontSize: 10 },
  actionText: {
    flex: 1,
    fontFamily: DIGEST_EXPORT_SERIF,
    fontSize: 10.2,
    lineHeight: 1.45,
  },
  participantLine: {
    marginBottom: 4,
    fontFamily: DIGEST_EXPORT_SERIF,
    fontSize: 9.8,
  },
  muted: {
    fontFamily: DIGEST_EXPORT_SERIF,
    fontStyle: "italic",
    fontSize: 10,
    color: T.proseFaint,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    fontFamily: DIGEST_EXPORT_MONO,
    fontSize: 7.3,
    color: T.proseFaint,
    textAlign: "center",
  },
});

type Props = { digest: Digest };

function PdfLinkList({ urls }: { urls: string[] }) {
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
}: {
  block: ProseBlock;
  participants: Digest["participants"];
}) {
  const who = block.speaker?.trim();
  const email = who ? resolveSpeakerToEmail(who, participants) : null;
  const panel = speakerPanelPdf(block.speaker, email);
  const { body, urls } = proseExportParts(block.content);
  const speaker = formatSpeakerLabel(block.speaker, block.message_index);

  const content = (
    <>
      {speaker ? <Text style={styles.speaker}>{speaker}</Text> : null}
      <Text style={styles.prose}>{body}</Text>
      <PdfLinkList urls={urls} />
    </>
  );

  if (panel) {
    return <View style={panel}>{content}</View>;
  }
  return <View style={{ marginBottom: 12 }}>{content}</View>;
}

export function DigestPdfDocument({ digest }: Props) {
  const statusStyle = DIGEST_STATUS_STYLE[digest.status];

  return (
    <Document
      title={digest.title}
      author={BRAND_NAME}
      subject={stripTrackingNoiseFromProse(digest.resolution_summary).slice(0, 180)}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>Thread story</Text>
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
          {BRAND_NAME} · {BRAND_URL.replace("https://", "")} · On-demand generation ·
          Email remains in Google
        </Text>
      </Page>
    </Document>
  );
}
