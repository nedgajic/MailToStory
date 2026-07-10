import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { Digest, NarrativeBlock } from "@/lib/digest-schema";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import { displayUrlLabel, extractUrlsFromText, stripUrlsFromText } from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";
import { flattenNarrativeForStory, type StoryRenderItem } from "@/lib/flattenNarrativeForStory";
import { resolveSpeakerToEmail } from "@/lib/speakerAvatar";

const STATUS_LABEL: Record<Digest["status"], string> = {
  resolved: "Resolved",
  ongoing: "Ongoing",
  pending_action: "Pending action",
  no_conclusion: "No conclusion",
};

/** Day-mode digest tokens (align with theme-tokens.css :root). */
const DAY = {
  pageBg: "#fdfcfa",
  prose: "#1a1a1a",
  proseSoft: "#555555",
  proseSofter: "#666666",
  proseFaint: "#888888",
  title: "#0f0f0f",
  border: "#e8e3da",
  borderStrong: "#e0dbd2",
  surface: "#f7f5f0",
  surface2: "#f0ede7",
  recapSummary: "#1a1a1a",
  copyFg: "#1d3557",
  nestedAttachment: "#fffdfc",
} as const;

const STATUS_STYLE: Record<
  Digest["status"],
  { labelColor: string; pillBg: string }
> = {
  resolved: { labelColor: "#2d6a4f", pillBg: "#d8f3dc" },
  ongoing: { labelColor: "#7b4f12", pillBg: "#fde8c8" },
  pending_action: { labelColor: "#1d3557", pillBg: "#d6e8f7" },
  no_conclusion: { labelColor: "#555555", pillBg: "#eeeeee" },
};

const SPEAKER_BG_LIGHT = [
  "#e6f4ea",
  "#fdecea",
  "#fff9e6",
  "#fff0e0",
  "#f3e5f5",
] as const;
const SPEAKER_ACCENT_LIGHT = [
  "#1b5e20",
  "#b71c1c",
  "#f57c00",
  "#e65100",
  "#6a1b9a",
] as const;

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
} | null {
  const s = speaker?.trim();
  if (!s) return null;
  const key = (emailForHue || s).trim();
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 33 + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % 5;
  return {
    backgroundColor: SPEAKER_BG_LIGHT[idx],
    borderLeftColor: SPEAKER_ACCENT_LIGHT[idx],
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 9,
    marginBottom: 9,
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: DAY.prose,
    backgroundColor: DAY.pageBg,
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: DAY.proseFaint,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 19,
    fontFamily: "Times-Bold",
    marginBottom: 6,
    color: DAY.title,
    lineHeight: 1.22,
  },
  meta: {
    fontFamily: "Courier",
    fontSize: 8.3,
    color: DAY.proseSoft,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Courier-Bold",
    fontSize: 8.8,
    letterSpacing: 1.2,
    color: DAY.proseSoft,
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: DAY.borderStrong,
  },
  recapShell: {
    padding: 3,
    backgroundColor: "#caccd4",
    borderRadius: 6,
    marginBottom: 6,
  },
  recapInner: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: "#f6f6f7",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(125, 127, 133, 0.45)",
  },
  recapKicker: {
    fontFamily: "Courier-Bold",
    fontSize: 7.3,
    color: DAY.proseSofter,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  recapPillRow: { marginBottom: 7 },
  recapPillText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  recapBody: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.52,
    color: DAY.recapSummary,
  },
  speaker: {
    fontFamily: "Courier-Bold",
    fontSize: 8.6,
    color: DAY.proseSoft,
    marginBottom: 4,
  },
  prose: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.68,
    marginBottom: 4,
    textAlign: "justify",
    color: DAY.prose,
  },
  resourcesBox: {
    marginTop: 6,
    marginBottom: 4,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: DAY.surface2,
    borderWidth: 1,
    borderColor: DAY.border,
    borderRadius: 5,
  },
  resourcesLabel: {
    fontFamily: "Courier-Bold",
    fontSize: 7.3,
    letterSpacing: 1.25,
    color: DAY.proseSofter,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  linkRow: { marginBottom: 4 },
  linkText: {
    fontFamily: "Courier",
    fontSize: 8.6,
    color: DAY.copyFg,
  },
  attachmentInResources: {
    marginTop: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: DAY.surface,
    borderWidth: 1,
    borderColor: DAY.border,
    borderRadius: 4,
  },
  attachmentName: {
    fontFamily: "Courier-Bold",
    fontSize: 9,
    color: DAY.prose,
    marginBottom: 3,
  },
  attachmentCtx: {
    fontFamily: "Times-Italic",
    fontSize: 9.3,
    color: DAY.proseSoft,
    lineHeight: 1.45,
  },
  attachmentOnlyInner: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: DAY.border,
    borderRadius: 5,
  },
  fileMark: {
    fontFamily: "Courier-Bold",
    fontSize: 7.5,
    letterSpacing: 0.6,
    color: DAY.proseSofter,
    marginRight: 8,
    width: 20,
  },
  timelineBlock: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#c9c2b4",
  },
  timelineMeta: {
    fontFamily: "Courier",
    fontSize: 8,
    color: DAY.proseSofter,
    marginBottom: 2,
  },
  timelineSummary: {
    fontFamily: "Times-Roman",
    fontSize: 10.3,
    lineHeight: 1.45,
  },
  actionRow: { flexDirection: "row", marginBottom: 5 },
  actionBullet: { width: 12, fontSize: 10 },
  actionText: { flex: 1, fontFamily: "Times-Roman", fontSize: 10.2, lineHeight: 1.45 },
  participantLine: {
    marginBottom: 4,
    fontFamily: "Times-Roman",
    fontSize: 9.8,
  },
  muted: { fontFamily: "Times-Italic", fontSize: 10, color: DAY.proseFaint },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    fontFamily: "Courier",
    fontSize: 7.3,
    color: "#aaaaaa",
    textAlign: "center",
  },
});

type Props = { digest: Digest };

function resourcesLabel(urlCount: number, attachmentCount: number) {
  if (urlCount > 0 && attachmentCount > 0) return "Links & files";
  if (urlCount > 0) return "Links";
  return "Files";
}

function PdfParagraphResources({
  urls,
  attachments,
  proseSpeaker,
}: {
  urls: string[];
  attachments: Extract<NarrativeBlock, { type: "attachment_reference" }>[];
  proseSpeaker?: string | null;
}) {
  if (urls.length === 0 && attachments.length === 0) return null;

  const firstAttSpeaker = attachments[0]?.speaker?.trim() ?? null;
  const showSpeakerOnFirst =
    attachments.length > 0 &&
    Boolean(firstAttSpeaker) &&
    firstAttSpeaker !== (proseSpeaker?.trim() ?? "");

  const label = resourcesLabel(urls.length, attachments.length);

  return (
    <View style={styles.resourcesBox}>
      <Text style={styles.resourcesLabel}>{label}</Text>
      {urls.map((href) => (
        <View key={href} style={styles.linkRow} wrap={false}>
          <Link src={href}>
            <Text style={styles.linkText}>
              ↗ {displayUrlLabel(href)}
            </Text>
          </Link>
        </View>
      ))}
      {attachments.length > 0 ? (
        <View style={{ marginTop: urls.length > 0 ? 6 : 0 }}>
          {showSpeakerOnFirst && firstAttSpeaker ? (
            <Text style={[styles.speaker, { marginTop: 0 }]} wrap={false}>
              {firstAttSpeaker}
            </Text>
          ) : null}
          {attachments.map((att, i) => (
            <View
              key={`${att.filename}-${String(att.message_index ?? "")}-${String(i)}`}
              style={[
                styles.attachmentInResources,
                i > 0 ? { marginTop: 5 } : {},
              ]}
              wrap={false}
            >
              <Text style={styles.attachmentName}>{att.filename}</Text>
              <Text style={styles.attachmentCtx}>{att.context}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function StoryPdfBlock({
  item,
  participants,
}: {
  item: StoryRenderItem;
  participants: Digest["participants"];
}) {
  if (item.kind === "attachment_only") {
    const block = item.block;
    const who = block.speaker?.trim();
    const email = who ? resolveSpeakerToEmail(who, participants) : null;
    const panel = speakerPanelPdf(block.speaker, email);

    const inner = (
      <View
        style={[
          styles.attachmentOnlyInner,
          {
            backgroundColor: panel
              ? DAY.nestedAttachment
              : DAY.surface,
          },
        ]}
        wrap={false}
      >
        <Text style={styles.fileMark}>FILE</Text>
        <View style={{ flex: 1 }}>
          {who ? (
            <Text style={[styles.speaker, { marginTop: 0 }]}>{who}</Text>
          ) : null}
          <Text style={styles.attachmentName}>{block.filename}</Text>
          <Text style={styles.attachmentCtx}>{stripTrackingNoiseFromProse(block.context)}</Text>
        </View>
      </View>
    );

    if (panel) {
      return (
        <View style={panel} wrap={false}>
          {inner}
        </View>
      );
    }
    return inner;
  }

  const block = item.block;
  const who = block.speaker?.trim();
  const email = who ? resolveSpeakerToEmail(who, participants) : null;
  const panel = speakerPanelPdf(block.speaker, email);
  const urls = extractUrlsFromText(block.content);
  const readable = stripTrackingNoiseFromProse(block.content);
  const resourcesBelow = urls.length > 0 || item.attachments.length > 0;
  const proseText = resourcesBelow
    ? stripUrlsFromText(readable)
    : readable;

  const body = (
    <>
      {who ? (
        <Text style={styles.speaker}>
          {who}
          {block.message_index != null ? ` · message ${block.message_index}` : ""}
        </Text>
      ) : null}
      <Text style={styles.prose}>{proseText}</Text>
      {resourcesBelow ? (
        <PdfParagraphResources
          urls={urls}
          attachments={item.attachments}
          proseSpeaker={who ?? null}
        />
      ) : null}
    </>
  );

  if (panel) {
    return <View style={panel}>{body}</View>;
  }
  return <View>{body}</View>;
}

export function DigestPdfDocument({ digest }: Props) {
  const statusStyle = STATUS_STYLE[digest.status];
  const generated = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const storyItems = flattenNarrativeForStory(digest.narrative);

  return (
    <Document
      title={digest.title}
      author={BRAND_NAME}
      subject={stripTrackingNoiseFromProse(digest.resolution_summary).slice(0, 180)}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>Thread story</Text>
        <Text style={styles.title}>{digest.title}</Text>
        <Text style={styles.meta}>
          {digest.participants.length} participants
          {digest.timeline.length
            ? ` · ${digest.timeline.length} timeline beats`
            : ""}
          {` · ${generated}`}
        </Text>

        <View style={styles.recapShell} wrap={false}>
          <View style={styles.recapInner}>
            <Text style={styles.recapKicker}>Recap</Text>
            <View style={styles.recapPillRow}>
              <Text
                style={[
                  styles.recapPillText,
                  {
                    color: statusStyle.labelColor,
                    backgroundColor: statusStyle.pillBg,
                  },
                ]}
              >
                {STATUS_LABEL[digest.status]}
              </Text>
            </View>
            <Text style={styles.recapBody}>
              {stripTrackingNoiseFromProse(digest.resolution_summary)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Story</Text>
        {storyItems.map((item, i) => (
          <StoryPdfBlock
            key={`${item.kind}-${item.sourceIndex}-${String(i)}`}
            item={item}
            participants={digest.participants}
          />
        ))}

        <Text style={styles.sectionTitle}>Timeline</Text>
        {digest.timeline.length === 0 ? (
          <Text style={styles.muted}>No timeline entries.</Text>
        ) : (
          digest.timeline.map((ev, i) => (
            <View key={i} style={styles.timelineBlock} wrap={false}>
              <Text style={styles.timelineMeta}>
                {ev.date} · {ev.actor}
                {ev.message_index != null ? ` · msg ${ev.message_index}` : ""}
              </Text>
              <Text style={styles.timelineSummary}>{ev.summary}</Text>
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
              <Text style={styles.actionText}>
                {item.action}
                {item.owner != null && item.owner !== ""
                  ? ` (${item.owner})`
                  : ""}
                {item.due != null && item.due !== ""
                  ? ` — due ${item.due}`
                  : ""}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Participants</Text>
        {digest.participants.map((p, i) => (
          <Text key={i} style={styles.participantLine}>
            {p.name || p.email}
            {p.email?.trim() ? ` <${p.email}>` : ""} — {p.role}
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
