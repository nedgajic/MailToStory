"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Digest, NarrativeBlock } from "@/lib/digest-schema";
import { AppTopBar, AppTopBarBackLink } from "@/components/app-top-bar";
import {
  DIGEST_URL_IN_TEXT_RE,
  displayUrlLabel,
  extractUrlsFromText,
  stripUrlsFromText,
} from "@/lib/extractUrlsFromText";
import { stripTrackingNoiseFromProse } from "@/lib/stripTrackingNoiseFromProse";
import {
  flattenNarrativeForStory,
  type StoryRenderItem,
} from "@/lib/flattenNarrativeForStory";
import {
  gravatarAvatarUrl,
  getInitials,
  initialsForSpeaker,
  resolveParticipantDisplayName,
  resolveSpeakerToEmail,
  type ParticipantLite,
} from "@/lib/speakerAvatar";
import { StoryExportActions } from "@/components/stories/story-export-actions";
import {
  DigestTabStrip,
  type DigestTabId,
} from "@/components/digest/digest-tab-strip";
import { DIGEST_STATUS_LABEL } from "@/lib/digestExportContent";
import {
  buildParticipantColorMap,
  buildParticipantLaneMap,
  participantLaneIndex,
  wayfarerPanelOffsetPercent,
  moonletterParticipantPanelLayout,
  moonletterPanelWidthCss,
  moonletterPanelOffsetCss,
  participantColorIndex,
  speakerColorKey,
} from "@/lib/participantColors";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import {
  buildActorMessageIndexMap,
  resolveGmailMessageId,
  resolveTurnSourceMessageId,
} from "@/lib/turnSourceMessage";

function speakerLane(speaker?: string | null): "a" | "b" {
  const s = speaker?.trim();
  if (!s) return "a";
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2 === 0 ? "a" : "b";
}

function storyTurnLayout(
  displayTheme: StoryDisplayTheme,
  speaker: string | null | undefined,
  email: string | null,
  participants: ParticipantLite[],
  participantLaneMap: Map<string, number>,
  participantLaneCount: number,
  motion: React.CSSProperties,
) {
  const who = speaker?.trim();
  const resolvedEmail = who
    ? email ?? resolveSpeakerToEmail(who, participants)
    : null;
  const stableParticipantKey = who
    ? speakerColorKey(who, resolvedEmail)
    : null;

  const lane =
    displayTheme === "wayfarer" || displayTheme === "moonletter"
      ? undefined
      : speakerLane(speaker);
  const laneSlot =
    displayTheme === "wayfarer" || displayTheme === "moonletter"
      ? participantLaneIndex(
          participants,
          speaker,
          resolvedEmail,
          participantLaneMap,
        )
      : null;

  const moonletterPanel =
    displayTheme === "moonletter" && stableParticipantKey
      ? moonletterParticipantPanelLayout(stableParticipantKey)
      : null;

  return {
    lane,
    laneSlot,
    moonletterPanel,
    panelOptions: {
      displayTheme,
      lane,
      laneSlot,
      participantCount: participantLaneCount,
    },
    proseStyle: {
      ...motion,
      ...(displayTheme === "wayfarer" && laneSlot != null
        ? { marginLeft: wayfarerPanelOffsetPercent(laneSlot, participantLaneCount) }
        : {}),
    },
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function attachmentPreviewKind(filename: string): "image" | "pdf" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (
    [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "bmp",
      "svg",
      "heic",
      "heif",
    ].includes(ext)
  ) {
    return "image";
  }
  return "other";
}

function attachmentDownloadUrl(
  threadId: string,
  messageId: string,
  filename: string,
): string {
  const q = new URLSearchParams({
    threadId,
    messageId,
    filename,
  });
  return `/api/attachment?${q.toString()}`;
}

function speakerPanelStyle(
  speaker: string | null | undefined,
  emailForHue: string | null,
  participants: ParticipantLite[],
  colorMap: Map<string, number>,
  options?: {
    displayTheme?: StoryDisplayTheme;
    lane?: "a" | "b";
    laneSlot?: number | null;
    participantCount?: number;
  },
): React.CSSProperties | null {
  const s = speaker?.trim();
  if (!s) return null;
  const idx = participantColorIndex(participants, s, emailForHue, colorMap);
  if (idx == null) return null;

  const bg = `var(--digest-speaker-${idx}-bg)`;
  const accent = `var(--digest-speaker-${idx}-accent)`;
  const useRightAccent =
    options?.displayTheme === "wayfarer" &&
    options?.laneSlot != null &&
    options.participantCount != null &&
    options.participantCount > 1 &&
    options.laneSlot === options.participantCount - 1;

  if (useRightAccent) {
    return {
      background: bg,
      borderLeft: "none",
      borderRight: `3px solid ${accent}`,
    };
  }

  if (options?.displayTheme === "moonletter") {
    return { background: bg };
  }

  return {
    background: bg,
    borderLeft: `3px solid ${accent}`,
  };
}

function turnPanelWrapperStyle(
  panel: React.CSSProperties | null,
  colorIdx: number | null,
  moonletterPanel?: { widthRatio: number; offsetRatio: number } | null,
): React.CSSProperties | undefined {
  if (!panel?.background && !moonletterPanel) return undefined;
  const vars: Record<string, string> = {};
  if (panel?.background) {
    vars["--digest-turn-panel-bg"] = String(panel.background);
  }
  if (colorIdx != null) {
    vars["--digest-turn-panel-accent"] =
      `var(--digest-speaker-${colorIdx}-accent)`;
  }
  const style: React.CSSProperties = vars as React.CSSProperties;
  if (moonletterPanel) {
    style.width = moonletterPanelWidthCss(moonletterPanel.widthRatio);
    style.maxWidth = style.width;
    style.marginLeft = moonletterPanelOffsetCss(moonletterPanel.offsetRatio);
  }
  return style;
}

function speakerColorIndex(
  speaker: string | null | undefined,
  email: string | null,
  participants: ParticipantLite[],
  colorMap: Map<string, number>,
): number | null {
  return participantColorIndex(participants, speaker, email, colorMap);
}

function SpeakerAvatar({
  displayName,
  email,
  participants,
  colorIndex,
  size = 28,
}: {
  displayName: string;
  email: string | null;
  participants?: ParticipantLite[];
  colorIndex?: number | null;
  size?: number;
}) {
  const [showPhoto, setShowPhoto] = useState(false);
  const resolvedName = participants
    ? resolveParticipantDisplayName(displayName, participants, email)
    : displayName;
  const initials = participants
    ? initialsForSpeaker(displayName, participants, email)
    : getInitials(resolvedName || email || "?");
  const accent =
    colorIndex != null
      ? `var(--digest-speaker-${colorIndex}-accent)`
      : undefined;

  useEffect(() => {
    setShowPhoto(false);
  }, [email]);

  return (
    <div
      className="digest-speaker-avatar"
      style={{
        width: size,
        height: size,
        border: accent ? `2px solid ${accent}` : undefined,
      }}
      title={resolvedName}
    >
      <span
        className="digest-speaker-avatar-initials"
        style={{ fontSize: `clamp(0.5rem, ${size * 0.32}px, 0.75rem)` }}
      >
        {initials}
      </span>
      {email ? (
        // eslint-disable-next-line @next/next/no-img-element -- Gravatar per-email, no Image optimizer benefit at this size
        <img
          className="digest-speaker-avatar-photo"
          src={gravatarAvatarUrl(email, size * 2)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          style={{ display: showPhoto ? "block" : "none" }}
          onLoad={() => setShowPhoto(true)}
          onError={() => setShowPhoto(false)}
        />
      ) : null}
    </div>
  );
}

function SpeakerTurnLabel({
  label,
  email,
  participants,
  colorIndex,
  size = 28,
}: {
  label: string;
  email: string | null;
  participants: ParticipantLite[];
  colorIndex?: number | null;
  size?: number;
}) {
  const accent =
    colorIndex != null
      ? `var(--digest-speaker-${colorIndex}-accent)`
      : "var(--digest-prose-soft)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size < 24 ? "0.35rem" : "0.5rem",
        marginBottom: size < 24 ? "0.3rem" : "0.45rem",
        minWidth: 0,
      }}
    >
      <SpeakerAvatar
        displayName={label}
        email={email}
        participants={participants}
        colorIndex={colorIndex}
        size={size}
      />
      <div
        className="digest-speaker-name"
        style={{
          fontSize: size < 24 ? "0.6rem" : "0.68rem",
          fontWeight: 600,
          color: accent,
          letterSpacing: "0.06em",
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function trimAttachmentFilename(filename: string, maxLen = 30): string {
  const name = filename.trim();
  if (name.length <= maxLen) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const baseBudget = maxLen - ext.length - 1;
  if (baseBudget < 4) return `${name.slice(0, maxLen - 1)}…`;
  return `${name.slice(0, baseBudget)}…${ext}`;
}

type AttachmentRef = Extract<NarrativeBlock, { type: "attachment_reference" }>;

function resourceSummary(urlCount: number, attachmentCount: number): string {
  const parts: string[] = [];
  if (urlCount > 0) {
    parts.push(urlCount === 1 ? "1 link" : `${urlCount} links`);
  }
  if (attachmentCount > 0) {
    parts.push(attachmentCount === 1 ? "1 file" : `${attachmentCount} files`);
  }
  return parts.join(" · ");
}

function PreviewGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OpenGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v7H3V3h7" />
    </svg>
  );
}

function TurnEvidenceFooter({
  urls,
  attachments,
  sourceMessageId,
  threadId,
  messageIdsInOrder,
  onOpenOriginal,
  onPreviewAttachment,
}: {
  urls: string[];
  attachments: AttachmentRef[];
  sourceMessageId: string | null;
  threadId: string;
  messageIdsInOrder: string[];
  onOpenOriginal: (messageId: string) => void;
  onPreviewAttachment: (messageId: string, filename: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = React.useId();
  const canUseOriginal =
    Boolean(threadId.trim()) && messageIdsInOrder.length > 0;
  const hasResources = urls.length > 0 || attachments.length > 0;
  const hasSource = Boolean(sourceMessageId);
  if (!hasResources && !hasSource) return null;

  const summary = resourceSummary(urls.length, attachments.length);

  const toggleExpanded = () => {
    if (hasResources) setExpanded((value) => !value);
  };

  return (
    <div className="digest-turn-evidence" aria-label="Links, attachments, and source">
      <div
        className={`digest-turn-evidence__banner${
          expanded ? " digest-turn-evidence__banner--expanded" : ""
        }${!hasResources ? " digest-turn-evidence__banner--source-only" : ""}`}
        role={hasResources ? "button" : undefined}
        tabIndex={hasResources ? 0 : undefined}
        aria-expanded={hasResources ? expanded : undefined}
        aria-controls={hasResources ? panelId : undefined}
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (!hasResources) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleExpanded();
          }
        }}
      >
        {hasResources ? (
          <span className="digest-turn-evidence__chevron" aria-hidden>
            {expanded ? "▾" : "▸"}
          </span>
        ) : null}
        {hasResources ? (
          <span className="digest-turn-evidence__summary">{summary}</span>
        ) : null}
        {hasSource && sourceMessageId ? (
          <span
            className="digest-turn-evidence__source"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {hasResources ? (
              <span className="digest-turn-evidence__dot" aria-hidden>
                ·
              </span>
            ) : null}
            <button
              type="button"
              className="digest-original-source-btn"
              onClick={() => onOpenOriginal(sourceMessageId)}
              aria-label="Show original email for this turn"
            >
              <span className="digest-original-source-caption">Original</span>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                <path d="M22 7.5 12.6 12.7a2 2 0 0 1-2.06 0L2 7.5" />
              </svg>
            </button>
          </span>
        ) : null}
      </div>
      {hasResources && expanded ? (
        <div className="digest-turn-evidence__panel" id={panelId}>
          {urls.length > 0 ? (
            <div className="digest-link-chip-row" role="list">
              {urls.map((href) => (
                <a
                  key={href}
                  href={href}
                  className="digest-link-chip"
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                >
                  <span className="digest-link-chip-icon" aria-hidden>
                    ↗
                  </span>
                  <span className="digest-link-chip-text">
                    {displayUrlLabel(href)}
                  </span>
                </a>
              ))}
            </div>
          ) : null}
          {attachments.length > 0 ? (
            <div className="digest-turn-evidence__file-row">
              {attachments.map((block, index) => {
                const label = trimAttachmentFilename(block.filename);
                const msgId = canUseOriginal
                  ? resolveGmailMessageId(
                      block.message_index ?? null,
                      messageIdsInOrder,
                    )
                  : null;
                const kind = attachmentPreviewKind(block.filename);
                const fileHref =
                  msgId && threadId.trim()
                    ? attachmentDownloadUrl(threadId, msgId, block.filename)
                    : null;
                return (
                  <div
                    key={`${block.filename}-${index}-${block.message_index ?? 0}`}
                    className="digest-turn-evidence__file-chip"
                    title={block.filename}
                  >
                    <span className="digest-turn-evidence__file-label">
                      {label}
                    </span>
                    {msgId && fileHref ? (
                      <span className="digest-turn-evidence__file-actions">
                        {kind !== "other" ? (
                          <button
                            type="button"
                            className="digest-turn-evidence__icon-btn"
                            aria-label={`Preview ${block.filename}`}
                            onClick={() =>
                              onPreviewAttachment(msgId, block.filename)
                            }
                          >
                            <PreviewGlyph />
                          </button>
                        ) : null}
                        <a
                          href={fileHref}
                          className="digest-turn-evidence__icon-btn"
                          aria-label={`Open ${block.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenGlyph />
                        </a>
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function linkifyDigestText(text: string): React.ReactNode {
  const re = DIGEST_URL_IN_TEXT_RE;
  re.lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    let raw = m[0];
    raw = raw.replace(/[.,;:!?)]+$/, "");
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    try {
      void new URL(href);
    } catch {
      nodes.push(m[0]);
      last = m.index + m[0].length;
      continue;
    }
    nodes.push(
      <a
        key={`lnk-${k++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="digest-inline-link"
      >
        {raw}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length === 0 ? text : <>{nodes}</>;
}

function StoryBlock({
  item,
  visualIndex,
  threadId,
  messageIdsInOrder,
  participants,
  actorMessageMap,
  participantColorMap,
  participantLaneMap,
  participantLaneCount,
  displayTheme,
  onOpenOriginal,
  onPreviewAttachment,
}: {
  item: StoryRenderItem;
  visualIndex: number;
  threadId: string;
  messageIdsInOrder: string[];
  participants: Digest["participants"];
  actorMessageMap: Map<string, number>;
  participantColorMap: Map<string, number>;
  participantLaneMap: Map<string, number>;
  participantLaneCount: number;
  displayTheme: StoryDisplayTheme;
  onOpenOriginal: (messageId: string) => void;
  onPreviewAttachment: (messageId: string, filename: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const canUseOriginal =
    Boolean(threadId.trim()) && messageIdsInOrder.length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const motion = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 0.5s ease ${visualIndex * 0.06}s, transform 0.5s ease ${visualIndex * 0.06}s`,
  } as const;

  const resolveSourceId = (input: {
    messageIndex?: number | null;
    speaker?: string | null;
  }) =>
    canUseOriginal
      ? resolveTurnSourceMessageId({
          messageIndex: input.messageIndex,
          speaker: input.speaker,
          messageIdsInOrder,
          turnIndex: visualIndex,
          actorMessageMap,
        })
      : null;

  if (item.kind === "attachment_only") {
    const block = item.block;
    const speakerLabel = block.speaker?.trim();
    const resolvedEmail = speakerLabel
      ? resolveSpeakerToEmail(speakerLabel, participants)
      : null;
    const colorIdx = speakerColorIndex(
      block.speaker,
      resolvedEmail,
      participants,
      participantColorMap,
    );
    const layout = storyTurnLayout(
      displayTheme,
      block.speaker,
      resolvedEmail,
      participants,
      participantLaneMap,
      participantLaneCount,
      motion,
    );
    const panel = speakerPanelStyle(
      block.speaker,
      resolvedEmail,
      participants,
      participantColorMap,
      layout.panelOptions,
    );
    const msgId = resolveSourceId({
      messageIndex: block.message_index,
      speaker: block.speaker,
    });
    const context = stripTrackingNoiseFromProse(block.context?.trim() ?? "");

    return (
      <div
        className="digest-story-turn-root"
        data-lane={layout.lane}
        data-participant-slot={layout.laneSlot ?? undefined}
        data-participant-count={
          displayTheme === "wayfarer" ? participantLaneCount : undefined
        }
      >
        <div ref={ref} className="digest-story-turn__prose" style={layout.proseStyle}>
          {panel ? (
            <div
              className="digest-story-turn__panel"
              style={turnPanelWrapperStyle(panel, colorIdx, layout.moonletterPanel)}
            >
              <div
                className="digest-story-bubble"
                style={{
                  ...panel,
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                }}
              >
                {speakerLabel ? (
                  <SpeakerTurnLabel
                    label={speakerLabel}
                    email={resolvedEmail}
                    participants={participants}
                    colorIndex={colorIdx}
                  />
                ) : null}
                {context ? (
                  <p className="digest-story-prose">{context}</p>
                ) : null}
              </div>
              {canUseOriginal ? (
                <TurnEvidenceFooter
                  urls={[]}
                  attachments={[block]}
                  sourceMessageId={msgId}
                  threadId={threadId}
                  messageIdsInOrder={messageIdsInOrder}
                  onOpenOriginal={onOpenOriginal}
                  onPreviewAttachment={onPreviewAttachment}
                />
              ) : null}
            </div>
          ) : (
            <>
              {context ? (
                <p className="digest-story-prose">{context}</p>
              ) : null}
              {canUseOriginal ? (
                <TurnEvidenceFooter
                  urls={[]}
                  attachments={[block]}
                  sourceMessageId={msgId}
                  threadId={threadId}
                  messageIdsInOrder={messageIdsInOrder}
                  onOpenOriginal={onOpenOriginal}
                  onPreviewAttachment={onPreviewAttachment}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  const block = item.block;
  const speakerLabel = block.speaker?.trim();
  const resolvedEmail = speakerLabel
    ? resolveSpeakerToEmail(speakerLabel, participants)
    : null;
  const colorIdx = speakerColorIndex(
    block.speaker,
    resolvedEmail,
    participants,
    participantColorMap,
  );
  const layout = storyTurnLayout(
    displayTheme,
    block.speaker,
    resolvedEmail,
    participants,
    participantLaneMap,
    participantLaneCount,
    motion,
  );
  const panel = speakerPanelStyle(
    block.speaker,
    resolvedEmail,
    participants,
    participantColorMap,
    layout.panelOptions,
  );
  const msgId = resolveSourceId({
    messageIndex: block.message_index,
    speaker: block.speaker,
  });

  const urls = extractUrlsFromText(block.content);
  const readableContent = stripTrackingNoiseFromProse(block.content);
  const resourcesBelow = urls.length > 0 || item.attachments.length > 0;
  const proseDisplay = resourcesBelow
    ? stripUrlsFromText(readableContent)
    : readableContent;
  const textEl = (
    <p className="digest-story-prose">
      {resourcesBelow ? proseDisplay : linkifyDigestText(readableContent)}
    </p>
  );

  const evidenceFooter = canUseOriginal ? (
    <TurnEvidenceFooter
      urls={urls}
      attachments={item.attachments}
      sourceMessageId={msgId}
      threadId={threadId}
      messageIdsInOrder={messageIdsInOrder}
      onOpenOriginal={onOpenOriginal}
      onPreviewAttachment={onPreviewAttachment}
    />
  ) : null;

  if (panel) {
    return (
      <div
        className="digest-story-turn-root"
        data-lane={layout.lane}
        data-participant-slot={layout.laneSlot ?? undefined}
        data-participant-count={
          displayTheme === "wayfarer" ? participantLaneCount : undefined
        }
      >
        <div ref={ref} className="digest-story-turn__prose" style={layout.proseStyle}>
          <div
            className="digest-story-turn__panel"
            style={turnPanelWrapperStyle(panel, colorIdx, layout.moonletterPanel)}
          >
            <div
              className="digest-story-bubble"
              style={{
                ...panel,
                padding: "0.85rem 1rem",
                borderRadius: "8px",
              }}
            >
              {speakerLabel ? (
                <SpeakerTurnLabel
                  label={speakerLabel}
                  email={resolvedEmail}
                  participants={participants}
                  colorIndex={colorIdx}
                />
              ) : null}
              {textEl}
            </div>
            {evidenceFooter}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="digest-story-turn-root"
      data-lane={layout.lane}
      data-participant-slot={layout.laneSlot ?? undefined}
      data-participant-count={
        displayTheme === "wayfarer" ? participantLaneCount : undefined
      }
    >
      <div ref={ref} className="digest-story-turn__prose" style={layout.proseStyle}>
        {textEl}
        {evidenceFooter}
      </div>
    </div>
  );
}

function ResolutionBanner({
  summary,
  status,
  panelRef,
}: {
  summary: string;
  status: Digest["status"];
  panelRef?: React.Ref<HTMLDivElement>;
}) {
  const summaryTrim = stripTrackingNoiseFromProse(summary?.trim() ?? "");
  return (
    <div ref={panelRef} className="digest-recap-panel">
      <div className="digest-recap-meta-row">
        <span className="digest-recap-kicker">Recap</span>
        <span className="digest-recap-status-pill" data-status={status}>
          {DIGEST_STATUS_LABEL[status]}
        </span>
      </div>
      <p
        className={
          summaryTrim
            ? "digest-recap-summary"
            : "digest-recap-summary digest-recap-summary-empty"
        }
      >
        {summaryTrim || "No recap summary was returned for this thread."}
      </p>
    </div>
  );
}

function Timeline({
  events,
  threadId,
  messageIdsInOrder,
  participants,
  onOpenMessage,
}: {
  events: Digest["timeline"];
  threadId: string;
  messageIdsInOrder: string[];
  participants: Digest["participants"];
  onOpenMessage: (messageId: string) => void;
}) {
  const canUseOriginal = Boolean(threadId.trim() && messageIdsInOrder.length);

  return (
    <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
      <div
        style={{
          position: "absolute",
          left: "5px",
          top: "8px",
          bottom: "8px",
          width: "1px",
          background: "var(--digest-timeline-line)",
        }}
      />

      {events.map((event, i) => {
        const messageId = resolveGmailMessageId(
          event.message_index ?? null,
          messageIdsInOrder,
        );
        const openable = Boolean(canUseOriginal && messageId);

        const actorEmail = resolveSpeakerToEmail(event.actor, participants);

        const rowInner = (
          <>
            <div
              style={{
                position: "absolute",
                left: "-1.5rem",
                top: "6px",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                background:
                  i === events.length - 1
                    ? "var(--digest-title)"
                    : "var(--app-bg)",
                border: "2px solid var(--digest-title)",
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginBottom: "0.25rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                    fontSize: "0.68rem",
                    color: "var(--digest-prose-faint)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {formatDateShort(event.date)}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--digest-prose)",
                    background: "var(--digest-surface-2)",
                    padding: "0.12rem 0.45rem 0.12rem 0.35rem",
                    borderRadius: "3px",
                  }}
                >
                  <SpeakerAvatar
                    displayName={event.actor}
                    email={actorEmail}
                    participants={participants}
                    size={22}
                  />
                  {event.actor}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-lora), Georgia, serif",
                  fontSize: "0.9rem",
                  color: "var(--digest-prose)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {event.summary}
              </p>
              {openable ? (
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                    fontSize: "0.62rem",
                    color: "var(--digest-copy-fg)",
                    margin: "0.45rem 0 0",
                    letterSpacing: "0.06em",
                  }}
                >
                  View original message →
                </p>
              ) : null}
            </div>
          </>
        );

        return (
          <div
            key={`${event.date}-${i}-${event.message_index ?? "x"}`}
            style={{
              position: "relative",
              marginBottom: i < events.length - 1 ? "1.5rem" : 0,
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            {openable ? (
              <button
                type="button"
                aria-label={`View original message: ${event.summary.slice(0, 120)}${event.summary.length > 120 ? "…" : ""}`}
                onClick={() => messageId && onOpenMessage(messageId)}
                style={{
                  all: "unset",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  width: "100%",
                  borderRadius: "8px",
                  outline: "none",
                  padding: "0.35rem 0.4rem 0.35rem 0",
                  margin: "-0.35rem -0.4rem -0.35rem 0",
                }}
                className="digest-timeline-hit"
              >
                {rowInner}
              </button>
            ) : (
              rowInner
            )}
          </div>
        );
      })}
    </div>
  );
}

function Participants({
  people,
  participantColorMap,
  displayTheme = "dossier",
}: {
  people: Digest["participants"];
  participantColorMap: Map<string, number>;
  displayTheme?: StoryDisplayTheme;
}) {
  const borderRadius =
    displayTheme === "dossier" || displayTheme === "wayfarer" ? "2px" : "6px";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      {people.map((p, i) => {
        const email = p.email?.trim() ? p.email.trim().toLowerCase() : null;
        const colorIdx = participantColorIndex(
          people,
          p.name || p.email,
          email,
          participantColorMap,
        );
        const panelStyle = speakerPanelStyle(
          p.name || p.email,
          email,
          people,
          participantColorMap,
          { displayTheme },
        );
        const accent =
          colorIdx != null
            ? `var(--digest-speaker-${colorIdx}-accent)`
            : undefined;

        return (
          <div
            key={`${p.email}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              borderRadius,
              padding: "0.5rem 0.75rem",
              ...(panelStyle ?? {
                background: "var(--digest-surface-2)",
                border: "1px solid var(--digest-border-strong)",
              }),
            }}
          >
            <SpeakerAvatar
              displayName={p.name || p.email || "?"}
              email={email}
              participants={people}
              colorIndex={colorIdx}
              size={30}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: accent ?? "var(--digest-prose)",
                }}
              >
                {p.name || p.email}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-lora), Georgia, serif",
                  fontSize: "0.7rem",
                  color: "var(--digest-prose-softer)",
                  fontStyle: "italic",
                }}
              >
                {p.role}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionItems({
  items,
  participants,
  participantColorMap,
  displayTheme = "dossier",
}: {
  items: NonNullable<Digest["action_items"]>;
  participants: Digest["participants"];
  participantColorMap: Map<string, number>;
  displayTheme?: StoryDisplayTheme;
}) {
  const borderRadius =
    displayTheme === "dossier" || displayTheme === "wayfarer" ? "2px" : "6px";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
    >
      {items.map((item, i) => {
        const owner = item.owner?.trim();
        const email = owner ? resolveSpeakerToEmail(owner, participants) : null;
        const colorIdx = owner
          ? participantColorIndex(
              participants,
              owner,
              email,
              participantColorMap,
            )
          : null;
        const panelStyle = owner
          ? speakerPanelStyle(
              owner,
              email,
              participants,
              participantColorMap,
              { displayTheme },
            )
          : null;
        const accent =
          colorIdx != null
            ? `var(--digest-speaker-${colorIdx}-accent)`
            : undefined;

        return (
          <div
            key={`${item.action}-${i}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.85rem 1rem",
              borderRadius,
              ...(panelStyle ?? {
                background: "var(--digest-surface-3)",
                border: "1px solid var(--digest-border)",
              }),
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: displayTheme === "dossier" ? "2px" : "3px",
                border: accent
                  ? `2px solid ${accent}`
                  : "2px solid var(--digest-border-strong)",
                flexShrink: 0,
                marginTop: "1px",
              }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontFamily: "var(--font-lora), Georgia, serif",
                  fontSize: "0.92rem",
                  color: "var(--digest-prose)",
                  margin: "0 0 0.25rem 0",
                  lineHeight: 1.5,
                }}
              >
                {item.action}
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {owner ? (
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                      fontSize: "0.67rem",
                      color: accent ?? "var(--digest-prose-softer)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    → {owner}
                  </span>
                ) : null}
                {item.due ? (
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                      fontSize: "0.67rem",
                      color: "var(--digest-prose-faint)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Due {formatDate(item.due)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
        fontSize: "0.63rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--digest-muted)",
        marginBottom: "1.25rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--digest-border)",
      }}
    >
      {children}
    </div>
  );
}

type TabId = DigestTabId;

type ThreadMessagePayload = {
  from: string;
  date: string;
  subject: string;
  body: string;
  bodyHtml: string | null;
};

function AttachmentPreviewModal({
  threadId,
  messageId,
  filename,
  onClose,
}: {
  threadId: string;
  messageId: string;
  filename: string;
  onClose: () => void;
}) {
  const kind = attachmentPreviewKind(filename);
  const url = attachmentDownloadUrl(threadId, messageId, filename);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [messageId, filename]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openFull = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shellStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 2600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding:
      "max(1rem, calc(var(--mkt-header-height, 4.75rem) + var(--story-page-toolbar-height, 3rem) + 0.5rem)) 1rem 1rem",
    background: "rgba(15, 15, 15, 0.45)",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: kind === "pdf" ? "min(920px, 96vw)" : "min(760px, 96vw)",
    maxHeight:
      "min(92vh, calc(100vh - var(--mkt-header-height, 4.75rem) - var(--story-page-toolbar-height, 3rem) - 2rem))",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "var(--digest-surface-card)",
    borderRadius: "10px",
    border: "1px solid var(--digest-border-strong)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="digest-attachment-preview-title"
      style={shellStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--digest-border)",
            flexShrink: 0,
          }}
        >
          <div
            id="digest-attachment-preview-title"
            style={{
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--digest-prose)",
              wordBreak: "break-word",
              minWidth: 0,
            }}
          >
            {filename}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontSize: "0.7rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              border: "1px solid var(--digest-border-strong)",
              background: "var(--digest-surface-card)",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            padding: "1rem 1.25rem",
            overflow: "auto",
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {kind === "image" && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated same-origin /api/attachment
            <img
              src={url}
              alt=""
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
              onError={() => setImgFailed(true)}
            />
          ) : null}
          {kind === "pdf" ? (
            <iframe
              title={filename}
              src={url}
              style={{
                width: "100%",
                height: "min(72vh, 720px)",
                minHeight: 440,
                border: "1px solid var(--digest-border)",
                borderRadius: 8,
                background: "var(--digest-surface)",
              }}
            />
          ) : null}
          {kind === "image" && imgFailed ? (
            <p
              style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                fontSize: "0.9rem",
                color: "var(--digest-prose-soft)",
                margin: 0,
              }}
            >
              {`Could not show this image inline. Use "Open full size" to view it in a new tab.`}
            </p>
          ) : null}
        </div>

        <div
          style={{
            padding: "0.75rem 1.25rem 1rem",
            borderTop: "1px solid var(--digest-border)",
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            className="digest-pdf-btn"
            onClick={openFull}
          >
            {kind === "image" ? "Open full size" : "Open in new tab"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OriginalMessageModal({
  threadId,
  messageId,
  onClose,
}: {
  threadId: string;
  messageId: string;
  onClose: () => void;
}) {
  const [state, setState] = React.useState<"loading" | "error" | "ok">(
    "loading",
  );
  const [payload, setPayload] = React.useState<ThreadMessagePayload | null>(
    null,
  );
  const [errText, setErrText] = React.useState("");

  useEffect(() => {
    if (!threadId) return;

    let cancelled = false;

    (async () => {
      try {
        const u = new URL("/api/thread-message", window.location.origin);
        u.searchParams.set("threadId", threadId);
        u.searchParams.set("messageId", messageId);
        const res = await fetch(u.toString(), { credentials: "include" });
        const data: unknown = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            typeof data === "object" &&
            data &&
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : `Request failed (${res.status})`;
          setErrText(msg);
          setState("error");
          return;
        }
        const d = data as ThreadMessagePayload & { html?: string | null };
        setPayload({
          subject: d.subject ?? "",
          from: d.from ?? "",
          date: d.date ?? "",
          body: d.body ?? "",
          bodyHtml: d.bodyHtml ?? d.html ?? null,
        });
        setState("ok");
      } catch {
        if (!cancelled) {
          setErrText("Could not load message.");
          setState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, messageId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="digest-original-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "max(1rem, calc(var(--mkt-header-height, 4.75rem) + var(--story-page-toolbar-height, 3rem) + 0.5rem)) 1rem 1rem",
        background: "rgba(15, 15, 15, 0.45)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "min(88vh, 900px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--digest-surface-card)",
          borderRadius: "10px",
          border: "1px solid var(--digest-border-strong)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--digest-border)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              id="digest-original-title"
              style={{
                fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--digest-prose-faint)",
                marginBottom: "0.35rem",
              }}
            >
              Original message
            </div>
            {payload?.subject ? (
              <div
                style={{
                  fontFamily: "var(--font-lora), Georgia, serif",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--digest-prose)",
                  lineHeight: 1.35,
                }}
              >
                {payload.subject}
              </div>
            ) : null}
            {payload?.from ? (
              <div
                style={{
                  fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                  fontSize: "0.72rem",
                  color: "var(--digest-prose-soft)",
                  marginTop: "0.35rem",
                  wordBreak: "break-word",
                }}
              >
                {payload.from}
                {payload.date ? ` · ${payload.date}` : ""}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontSize: "0.7rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              border: "1px solid var(--digest-border-strong)",
              background: "var(--digest-surface-card)",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            padding: "1rem 1.25rem 1.25rem",
            overflow: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {state === "loading" ? (
            <p
              style={{
                fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                fontSize: "0.78rem",
                color: "var(--digest-prose-softer)",
                margin: 0,
              }}
            >
              Loading…
            </p>
          ) : null}
          {state === "error" ? (
            <p
              style={{
                color: "#b00020",
                fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                fontSize: "0.8rem",
                margin: 0,
              }}
            >
              {errText}
            </p>
          ) : null}
          {state === "ok" && payload ? (
            payload.bodyHtml?.trim() ? (
              <div
                className="digest-original-html"
                dangerouslySetInnerHTML={{ __html: payload.bodyHtml }}
              />
            ) : (
              <pre
                style={{
                  fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                  fontSize: "0.78rem",
                  lineHeight: 1.6,
                  color: "var(--digest-title)",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {payload.body?.trim() ? payload.body : "(No message body)"}
              </pre>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function DigestRenderer({
  digest,
  threadId,
  messageIdsInOrder = [],
  embedded = false,
  hideAppTopBar = false,
  displayTheme = "dossier",
  colorMode = "dark",
  onClose,
}: {
  digest: Digest;
  threadId: string;
  messageIdsInOrder?: string[];
  embedded?: boolean;
  hideAppTopBar?: boolean;
  displayTheme?: StoryDisplayTheme;
  colorMode?: StoryColorMode;
  onClose?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("story");
  const [tabRevealKey, setTabRevealKey] = useState(0);
  const handleTabChange = useCallback(
    (id: TabId) => {
      setActiveTab(id);
      if (hideAppTopBar) setTabRevealKey((key) => key + 1);
    },
    [hideAppTopBar],
  );
  const [originalMessageId, setOriginalMessageId] = useState<string | null>(
    null,
  );
  const [attachmentPreview, setAttachmentPreview] = useState<{
    messageId: string;
    filename: string;
  } | null>(null);

  const tabs: { id: TabId; label: string }[] = [
    { id: "story", label: "Story" },
    { id: "timeline", label: "Timeline" },
    { id: "actions", label: "Actions" },
  ];

  const firstTimeline = digest.timeline[0];
  const lastTimeline = digest.timeline[digest.timeline.length - 1];
  const storyItems = useMemo(
    () => flattenNarrativeForStory(digest.narrative),
    [digest.narrative],
  );
  const firstTurnParticipantKey = useMemo(() => {
    const first = storyItems[0];
    if (!first) return null;
    const speaker = first.block.speaker?.trim();
    if (!speaker) return null;
    const email = resolveSpeakerToEmail(speaker, digest.participants);
    return speakerColorKey(speaker, email);
  }, [storyItems, digest.participants]);
  const actorMessageMap = useMemo(
    () => buildActorMessageIndexMap(digest.timeline),
    [digest.timeline],
  );
  const participantColorMap = useMemo(
    () =>
      buildParticipantColorMap(digest.participants, {
        theme: displayTheme,
        colorMode,
        firstTurnParticipantKey: firstTurnParticipantKey,
      }),
    [digest.participants, displayTheme, colorMode, firstTurnParticipantKey],
  );
  const participantLaneMap = useMemo(
    () => buildParticipantLaneMap(digest.participants),
    [digest.participants],
  );
  const participantLaneCount = participantLaneMap.size;
  const recapPanelRef = useRef<HTMLDivElement>(null);
  const digestWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (displayTheme !== "wayfarer" && displayTheme !== "moonletter") return;

    const panel = recapPanelRef.current;
    const wrap = digestWrapRef.current;
    if (!panel || !wrap) return;

    let raf = 0;

    const syncRecapPanelWidths = () => {
      const width = panel.getBoundingClientRect().width;
      if (width <= 0) return;
      if (displayTheme === "wayfarer") {
        wrap.style.setProperty("--wayfarer-recap-panel-width", `${width}px`);
        wrap.style.setProperty("--wayfarer-turn-panel-width", `${width * 0.8}px`);
      }
      if (displayTheme === "moonletter") {
        wrap.style.setProperty("--moonletter-recap-panel-width", `${width}px`);
      }
    };

    const scheduleSync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncRecapPanelWidths);
    };

    scheduleSync();
    const observer = new ResizeObserver(scheduleSync);
    observer.observe(panel);
    window.addEventListener("resize", scheduleSync);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", scheduleSync);
      wrap.style.removeProperty("--wayfarer-recap-panel-width");
      wrap.style.removeProperty("--wayfarer-turn-panel-width");
      wrap.style.removeProperty("--moonletter-recap-panel-width");
    };
  }, [displayTheme, digest.resolution_summary, digest.status]);

  return (
    <>
      {embedded ? (
        <div className="digest-embedded-toolbar">
          {onClose ? (
            <button type="button" className="inbox-detail-back" onClick={onClose}>
              ← Back to inbox
            </button>
          ) : null}
          <StoryExportActions digest={digest} />
        </div>
      ) : hideAppTopBar ? null : (
        <AppTopBar
          contentMaxWidth="digest"
          startSlot={
            <>
              <AppTopBarBackLink />
              <StoryExportActions digest={digest} />
            </>
          }
        />
      )}
      <div
        ref={digestWrapRef}
        className={`digest-wrap${embedded ? " digest-wrap--embedded" : ""}${hideAppTopBar ? " digest-wrap--story-page" : ""}`}
      >
      <div className="digest-story-recap-zone">
      <div className="digest-story-header-block">
      <section
        className="digest-story-recap-section"
        aria-label="Recap"
      >
        <div className="digest-story-section__head">
          <div className="digest-story-kicker">Thread story</div>
          <h1 className="digest-story-heading">{digest.title}</h1>
          <div className="digest-story-dateline">
            {digest.participants.length} participants
            {digest.timeline.length
              ? ` · ${digest.timeline.length} timeline beats`
              : ""}
            {firstTimeline && lastTimeline ? (
              <>
                {" "}
                · {formatDateShort(firstTimeline.date)} –{" "}
                {formatDateShort(lastTimeline.date)}
              </>
            ) : null}
          </div>
        </div>

        <div className="digest-recap-align">
          <div className="digest-recap-align__main">
            <ResolutionBanner
              summary={digest.resolution_summary}
              status={digest.status}
              panelRef={recapPanelRef}
            />
          </div>
          <div className="digest-recap-align__rail" aria-hidden="true" />
        </div>
      </section>
      </div>
      </div>

      <section
        className="digest-story-tabs-section digest-story-section-wave-bottom"
        data-display-theme={displayTheme}
        aria-label="Story sections"
      >
        <div
          className={`digest-story-tabs-section__inner${hideAppTopBar ? " digest-story-tabs-section__inner--story-page" : " digest-story-tabs-section__inner--embedded"}`}
        >
          <DigestTabStrip
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            animated={hideAppTopBar}
          />
        </div>
      </section>

      <section
        className="digest-story-body-section digest-story-section-wave-overlap"
        aria-label="Story content"
      >
        <div
          id="digest-panel-story"
          role="tabpanel"
          className={`digest-tab-panel digest-panel-story digest-panel-story--grid${hideAppTopBar ? " digest-tab-panel--story-reveal" : ""}`}
          hidden={activeTab !== "story"}
          aria-labelledby="digest-tab-story"
          data-reveal-key={
            hideAppTopBar && activeTab === "story" ? tabRevealKey : undefined
          }
        >
          {storyItems.map((item, i) => (
            <StoryBlock
              key={`${item.kind}-${item.sourceIndex}`}
              item={item}
              visualIndex={i}
              threadId={threadId}
              messageIdsInOrder={messageIdsInOrder}
              participants={digest.participants}
              actorMessageMap={actorMessageMap}
              participantColorMap={participantColorMap}
              participantLaneMap={participantLaneMap}
              participantLaneCount={participantLaneCount}
              displayTheme={displayTheme}
              onOpenOriginal={setOriginalMessageId}
              onPreviewAttachment={(mid, fn) =>
                setAttachmentPreview({ messageId: mid, filename: fn })
              }
            />
          ))}
        </div>

        <div
          id="digest-panel-timeline"
          role="tabpanel"
          className={`digest-tab-panel${hideAppTopBar ? " digest-tab-panel--story-reveal" : ""}`}
          hidden={activeTab !== "timeline"}
          aria-labelledby="digest-tab-timeline"
          data-reveal-key={
            hideAppTopBar && activeTab === "timeline" ? tabRevealKey : undefined
          }
        >
          <SectionLabel>Thread timeline</SectionLabel>
          <Timeline
            events={digest.timeline}
            threadId={threadId}
            messageIdsInOrder={messageIdsInOrder}
            participants={digest.participants}
            onOpenMessage={setOriginalMessageId}
          />
        </div>

        <div
          id="digest-panel-actions"
          role="tabpanel"
          className={`digest-tab-panel digest-tab-panel--actions${hideAppTopBar ? " digest-tab-panel--story-reveal" : ""}`}
          hidden={activeTab !== "actions"}
          aria-labelledby="digest-tab-actions"
          data-reveal-key={
            hideAppTopBar && activeTab === "actions" ? tabRevealKey : undefined
          }
        >
          {digest.action_items.length > 0 ? (
            <div>
              <SectionLabel>Action items</SectionLabel>
              <ActionItems
                items={digest.action_items}
                participants={digest.participants}
                participantColorMap={participantColorMap}
                displayTheme={displayTheme}
              />
            </div>
          ) : null}
          <div>
            <SectionLabel>Participants</SectionLabel>
            <Participants
              people={digest.participants}
              participantColorMap={participantColorMap}
              displayTheme={displayTheme}
            />
          </div>
        </div>
      </section>

      {attachmentPreview ? (
        <AttachmentPreviewModal
          key={`${attachmentPreview.messageId}:${attachmentPreview.filename}`}
          threadId={threadId}
          messageId={attachmentPreview.messageId}
          filename={attachmentPreview.filename}
          onClose={() => setAttachmentPreview(null)}
        />
      ) : null}
      {originalMessageId ? (
        <OriginalMessageModal
          key={originalMessageId}
          threadId={threadId}
          messageId={originalMessageId}
          onClose={() => setOriginalMessageId(null)}
        />
      ) : null}
    </div>
    </>
  );
}
