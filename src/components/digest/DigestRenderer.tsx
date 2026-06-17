"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import type { Digest, NarrativeBlock } from "@/lib/digest-schema";
import { AppTopBar, AppTopBarBackLink } from "@/components/app-top-bar";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";
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
  resolveSpeakerToEmail,
} from "@/lib/speakerAvatar";

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusConfig(status: Digest["status"]) {
  const map = {
    resolved: { label: "Resolved", color: "#2d6a4f", bg: "#d8f3dc" },
    ongoing: { label: "Ongoing", color: "#7b4f12", bg: "#fde8c8" },
    pending_action: { label: "Pending Action", color: "#1d3557", bg: "#d6e8f7" },
    no_conclusion: { label: "No Conclusion", color: "var(--digest-prose-soft)", bg: "#eee" },
  };
  return map[status] ?? map.no_conclusion;
}

function fileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    pdf: "📄",
    xlsx: "📊",
    xls: "📊",
    csv: "📊",
    docx: "📝",
    png: "🖼",
    jpg: "🖼",
    jpeg: "🖼",
    gif: "🖼",
    zip: "🗜",
  };
  return icons[ext] ?? "📎";
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
  speaker: string | undefined,
  emailForHue: string | null,
): {
  background: string;
  borderLeft: string;
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
    background: `var(--digest-speaker-${idx}-bg)`,
    borderLeft: `3px solid var(--digest-speaker-${idx}-accent)`,
  };
}

function SpeakerAvatar({
  displayName,
  email,
  size = 28,
}: {
  displayName: string;
  email: string | null;
  size?: number;
}) {
  const [useFallback, setUseFallback] = useState(!email);
  const initials = getInitials(displayName || email || "?");

  return (
    <div
      className="digest-speaker-avatar"
      style={{ width: size, height: size }}
      title={displayName}
    >
      {email && !useFallback ? (
        // eslint-disable-next-line @next/next/no-img-element -- Gravatar per-email, no Image optimizer benefit at this size
        <img
          src={gravatarAvatarUrl(email, size * 2)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setUseFallback(true)}
        />
      ) : (
        <span
          className="digest-speaker-avatar-initials"
          style={{ fontSize: `clamp(0.5rem, ${size * 0.32}px, 0.75rem)` }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

function SpeakerTurnLabel({
  label,
  email,
  size = 28,
}: {
  label: string;
  email: string | null;
  size?: number;
}) {
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
      <SpeakerAvatar displayName={label} email={email} size={size} />
      <div
        style={{
          fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
          fontSize: size < 24 ? "0.6rem" : "0.68rem",
          fontWeight: 600,
          color: "var(--digest-prose-soft)",
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

function resolveGmailMessageId(
  messageIndex: number | null | undefined,
  messageIdsInOrder: string[],
): string | null {
  if (messageIndex == null || messageIndex < 1) return null;
  const id = messageIdsInOrder[messageIndex - 1];
  return id?.trim() ? id : null;
}

function OriginalMailIconButton({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className="digest-original-mail-icon-btn"
      onClick={onClick}
      aria-label={ariaLabel}
    >
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
  );
}

function OriginalEmailHintRow({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="digest-original-source-row">
      <span className="digest-original-source-caption">Source</span>
      <OriginalMailIconButton
        onClick={onOpen}
        ariaLabel="Show original email in HTML"
      />
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

function AttachmentStripCard({
  block,
  threadId,
  messageIdsInOrder,
  onPreviewAttachment,
}: {
  block: Extract<NarrativeBlock, { type: "attachment_reference" }>;
  threadId: string;
  messageIdsInOrder: string[];
  onPreviewAttachment: (messageId: string, filename: string) => void;
}) {
  const canUseOriginal =
    Boolean(threadId.trim()) && messageIdsInOrder.length > 0;
  const msgId = canUseOriginal
    ? resolveGmailMessageId(block.message_index ?? null, messageIdsInOrder)
    : null;
  const kind = attachmentPreviewKind(block.filename);
  const fileHref =
    msgId && threadId.trim()
      ? attachmentDownloadUrl(threadId, msgId, block.filename)
      : null;

  return (
    <div className="digest-attachment-strip">
      <span className="digest-attachment-strip-icon" aria-hidden>
        {fileIcon(block.filename)}
      </span>
      <div className="digest-attachment-strip-body">
        <div className="digest-attachment-strip-name">{block.filename}</div>
        <p className="digest-attachment-strip-context">{block.context}</p>
        {msgId && fileHref ? (
          <div className="digest-attachment-file-actions digest-attachment-file-actions--in-strip">
            {kind !== "other" ? (
              <button
                type="button"
                className="digest-attachment-preview-btn"
                onClick={() => onPreviewAttachment(msgId, block.filename)}
              >
                Preview
              </button>
            ) : null}
            <a
              href={fileHref}
              className="digest-attachment-preview-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open file
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ParagraphResources({
  urls,
  attachments,
  threadId,
  messageIdsInOrder,
  participants,
  onPreviewAttachment,
  proseSpeaker,
}: {
  urls: string[];
  attachments: Extract<NarrativeBlock, { type: "attachment_reference" }>[];
  threadId: string;
  messageIdsInOrder: string[];
  participants: Digest["participants"];
  onPreviewAttachment: (messageId: string, filename: string) => void;
  proseSpeaker?: string | null;
}) {
  if (urls.length === 0 && attachments.length === 0) return null;

  const firstAttSpeaker = attachments[0]?.speaker?.trim() ?? null;
  const showSpeakerOnFirst =
    attachments.length > 0 &&
    Boolean(firstAttSpeaker) &&
    firstAttSpeaker !== (proseSpeaker?.trim() ?? "");
  const firstEmail =
    showSpeakerOnFirst && firstAttSpeaker
      ? resolveSpeakerToEmail(firstAttSpeaker, participants)
      : null;

  const resourcesLabel =
    urls.length > 0 && attachments.length > 0
      ? "Links & files"
      : urls.length > 0
        ? "Links"
        : "Files";

  return (
    <div className="digest-paragraph-resources">
      <div className="digest-paragraph-resources-label">{resourcesLabel}</div>
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
        <div className="digest-attachment-strip-stack">
          {showSpeakerOnFirst && firstAttSpeaker ? (
            <SpeakerTurnLabel
              label={firstAttSpeaker}
              email={firstEmail}
              size={22}
            />
          ) : null}
          {attachments.map((att, i) => (
            <AttachmentStripCard
              key={`${att.filename}-${i}-${att.message_index ?? 0}`}
              block={att}
              threadId={threadId}
              messageIdsInOrder={messageIdsInOrder}
              onPreviewAttachment={onPreviewAttachment}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StoryMetaStrip({
  resources,
  sourceMessageId,
  onOpenOriginal,
}: {
  resources: React.ReactNode;
  sourceMessageId: string | null;
  onOpenOriginal: (messageId: string) => void;
}) {
  if (!resources && !sourceMessageId) return null;
  const sourceOnly = !resources && Boolean(sourceMessageId);
  return (
    <div
      className={
        sourceOnly
          ? "digest-story-meta-strip digest-story-meta-strip--source-only"
          : "digest-story-meta-strip"
      }
    >
      {resources ? (
        <div className="digest-story-meta-strip__resources">{resources}</div>
      ) : null}
      {sourceMessageId ? (
        <div className="digest-story-meta-strip__source">
          <OriginalEmailHintRow
            onOpen={() => onOpenOriginal(sourceMessageId)}
          />
        </div>
      ) : null}
    </div>
  );
}

function StoryBlock({
  item,
  visualIndex,
  threadId,
  messageIdsInOrder,
  participants,
  onOpenOriginal,
  onPreviewAttachment,
}: {
  item: StoryRenderItem;
  visualIndex: number;
  threadId: string;
  messageIdsInOrder: string[];
  participants: Digest["participants"];
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

  if (item.kind === "attachment_only") {
    const block = item.block;
    const speakerLabel = block.speaker?.trim();
    const resolvedEmail = speakerLabel
      ? resolveSpeakerToEmail(speakerLabel, participants)
      : null;
    const panel = speakerPanelStyle(block.speaker, resolvedEmail);
    const msgId = canUseOriginal
      ? resolveGmailMessageId(block.message_index ?? null, messageIdsInOrder)
      : null;
    const kind = attachmentPreviewKind(block.filename);
    const fileHref =
      msgId && threadId.trim()
        ? attachmentDownloadUrl(threadId, msgId, block.filename)
        : null;

    const innerCard = (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          background: panel
            ? "var(--digest-attachment-on-panel-inner)"
            : "var(--digest-surface)",
          border: "1px solid var(--digest-border)",
          borderRadius: "6px",
          padding: "1rem 1.25rem",
        }}
      >
        <span
          style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}
          aria-hidden
        >
          {fileIcon(block.filename)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {speakerLabel ? (
            <SpeakerTurnLabel label={speakerLabel} email={resolvedEmail} />
          ) : null}
          <div
            style={{
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--digest-prose)",
              marginBottom: "0.3rem",
            }}
          >
            {block.filename}
          </div>
          <p
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: "0.88rem",
              color: "var(--digest-prose-soft)",
              margin: 0,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            {stripTrackingNoiseFromProse(block.context)}
          </p>
        </div>
      </div>
    );

    const attachmentActions =
      msgId && fileHref ? (
        <div className="digest-attachment-file-actions digest-story-meta-strip__attachment-actions-inner">
          {kind !== "other" ? (
            <button
              type="button"
              className="digest-attachment-preview-btn"
              onClick={() => onPreviewAttachment(msgId, block.filename)}
            >
              Preview
            </button>
          ) : null}
          <a
            href={fileHref}
            className="digest-attachment-preview-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open file
          </a>
        </div>
      ) : null;

    const hasAttachmentMeta = Boolean(attachmentActions || msgId);

    return (
      <div className="digest-story-turn-root">
        <div ref={ref} className="digest-story-turn__prose" style={{ ...motion }}>
          {panel ? (
            <div
              style={{
                ...panel,
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              {innerCard}
            </div>
          ) : (
            innerCard
          )}
        </div>
        {hasAttachmentMeta ? (
          <aside
            className="digest-story-turn__meta"
            aria-label="Attachments and source"
          >
            <StoryMetaStrip
              resources={attachmentActions}
              sourceMessageId={msgId}
              onOpenOriginal={onOpenOriginal}
            />
          </aside>
        ) : (
          <div
            className="digest-story-turn__meta digest-story-turn__meta--empty"
            aria-hidden
          />
        )}
      </div>
    );
  }

  const block = item.block;
  const speakerLabel = block.speaker?.trim();
  const resolvedEmail = speakerLabel
    ? resolveSpeakerToEmail(speakerLabel, participants)
    : null;
  const panel = speakerPanelStyle(block.speaker, resolvedEmail);
  const msgId = canUseOriginal
    ? resolveGmailMessageId(block.message_index ?? null, messageIdsInOrder)
    : null;

  const urls = extractUrlsFromText(block.content);
  const readableContent = stripTrackingNoiseFromProse(block.content);
  const resourcesBelow = urls.length > 0 || item.attachments.length > 0;
  const proseDisplay = resourcesBelow
    ? stripUrlsFromText(readableContent)
    : readableContent;
  const textEl = (
    <p
      style={{
        fontFamily: "var(--font-lora), Georgia, serif",
        fontSize: "1.08rem",
        lineHeight: 1.85,
        color: "var(--digest-prose)",
        margin: 0,
      }}
    >
      {resourcesBelow ? proseDisplay : linkifyDigestText(readableContent)}
    </p>
  );

  const resources = resourcesBelow ? (
      <ParagraphResources
        urls={urls}
        attachments={item.attachments}
        threadId={threadId}
        messageIdsInOrder={messageIdsInOrder}
        participants={participants}
        onPreviewAttachment={onPreviewAttachment}
        proseSpeaker={speakerLabel ?? null}
      />
    ) : null;

  const hasMeta = Boolean(resources || msgId);

  if (panel) {
    return (
      <div className="digest-story-turn-root">
        <div ref={ref} className="digest-story-turn__prose" style={{ ...motion }}>
          <div
            style={{
              ...panel,
              padding: "0.85rem 1rem",
              borderRadius: "8px",
            }}
          >
            {speakerLabel ? (
              <SpeakerTurnLabel label={speakerLabel} email={resolvedEmail} />
            ) : null}
            {textEl}
          </div>
        </div>
        {hasMeta ? (
          <aside
            className="digest-story-turn__meta"
            aria-label="Links, attachments, and source for this message"
          >
            <StoryMetaStrip
              resources={resources}
              sourceMessageId={msgId}
              onOpenOriginal={onOpenOriginal}
            />
          </aside>
        ) : (
          <div
            className="digest-story-turn__meta digest-story-turn__meta--empty"
            aria-hidden
          />
        )}
      </div>
    );
  }

  return (
    <div className="digest-story-turn-root">
      <div ref={ref} className="digest-story-turn__prose" style={{ ...motion }}>
        {textEl}
      </div>
      {hasMeta ? (
        <aside
          className="digest-story-turn__meta"
          aria-label="Links, attachments, and source for this message"
        >
          <StoryMetaStrip
            resources={resources}
            sourceMessageId={msgId}
            onOpenOriginal={onOpenOriginal}
          />
        </aside>
      ) : (
        <div
          className="digest-story-turn__meta digest-story-turn__meta--empty"
          aria-hidden
        />
      )}
    </div>
  );
}

function ResolutionBanner({
  summary,
  status,
}: {
  summary: string;
  status: Digest["status"];
}) {
  const cfg = statusConfig(status);
  const summaryTrim = stripTrackingNoiseFromProse(summary?.trim() ?? "");
  return (
    <div className="digest-recap-panel">
      <div className="digest-recap-panel-inner">
        <div className="digest-recap-meta-row">
          <span className="digest-recap-kicker">Recap</span>
          <span
            className="digest-recap-status-pill"
            style={{
              color: cfg.color,
              background: cfg.bg,
            }}
          >
            {cfg.label}
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

function Participants({ people }: { people: Digest["participants"] }) {
  const roleColors = [
    "var(--digest-surface-2)",
    "var(--digest-surface-2)",
    "var(--digest-surface-2)",
    "var(--digest-surface-2)",
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      {people.map((p, i) => (
        <div
          key={`${p.email}-${i}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: roleColors[i % roleColors.length],
            border: "1px solid var(--digest-border-strong)",
            borderRadius: "6px",
            padding: "0.5rem 0.75rem",
          }}
        >
          <SpeakerAvatar
            displayName={p.name || p.email || "?"}
            email={p.email?.trim() ? p.email.trim().toLowerCase() : null}
            size={30}
          />
          <div>
            <div
              style={{
                fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--digest-prose)",
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
      ))}
    </div>
  );
}

function ActionItems({ items }: { items: NonNullable<Digest["action_items"]> }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
    >
      {items.map((item, i) => (
        <div
          key={`${item.action}-${i}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "var(--digest-surface-3)",
            border: "1px solid var(--digest-border)",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "3px",
              border: "2px solid var(--digest-border-strong)",
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
              {item.owner ? (
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
                    fontSize: "0.67rem",
                    color: "var(--digest-prose-softer)",
                    letterSpacing: "0.04em",
                  }}
                >
                  → {item.owner}
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
      ))}
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

type TabId = "story" | "timeline" | "actions";

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
    zIndex: 2100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    background: "rgba(15, 15, 15, 0.45)",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: kind === "pdf" ? "min(920px, 96vw)" : "min(760px, 96vw)",
    maxHeight: "min(92vh, 960px)",
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
          }}
        >
          {kind === "image" && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated same-origin /api/attachment
            <img
              src={url}
              alt=""
              style={{
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                maxHeight: "min(58vh, 540px)",
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
        const d = data as ThreadMessagePayload;
        setPayload(d);
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
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
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
}: {
  digest: Digest;
  threadId: string;
  messageIdsInOrder?: string[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("story");
  const [originalMessageId, setOriginalMessageId] = useState<string | null>(
    null,
  );
  const [attachmentPreview, setAttachmentPreview] = useState<{
    messageId: string;
    filename: string;
  } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  const tabs: { id: TabId; label: string }[] = [
    { id: "story", label: "Story" },
    { id: "timeline", label: "Timeline" },
    { id: "actions", label: "Actions" },
  ];

  const firstTimeline = digest.timeline[0];
  const lastTimeline = digest.timeline[digest.timeline.length - 1];

  async function exportPdf() {
    setPdfLoading(true);
    // Do not pass `noopener` here: Chromium returns `null` while still opening a tab,
    // so we lose `preview` and incorrectly fall back to navigating this window.
    const preview = window.open("about:blank", "_blank");
    let pdfObjectUrl: string | null = null;
    try {
      const res = await fetch("/api/digest-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ digest }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      pdfObjectUrl = URL.createObjectURL(blob);
      const releaseLater = () => {
        const u = pdfObjectUrl;
        window.setTimeout(() => {
          if (u) URL.revokeObjectURL(u);
        }, 180_000);
      };

      if (preview && !preview.closed) {
        preview.location.replace(pdfObjectUrl);
        releaseLater();
        return;
      }

      const w = window.open(pdfObjectUrl, "_blank");
      if (w && !w.closed) {
        releaseLater();
        return;
      }

      const a = document.createElement("a");
      a.href = pdfObjectUrl;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      releaseLater();
    } catch (e) {
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
      if (preview && !preview.closed) {
        preview.close();
      }
      window.alert(
        e instanceof Error ? e.message : "Could not generate PDF.",
      );
    } finally {
      setPdfLoading(false);
    }
  }

  async function exportWordDoc() {
    setWordLoading(true);
    try {
      const res = await fetch("/api/digest-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ digest }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const base = digestPdfBaseFilename(digest.title);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.docx`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not export Word document.",
      );
    } finally {
      setWordLoading(false);
    }
  }

  return (
    <>
      <AppTopBar
        contentMaxWidth="digest"
        startSlot={
          <>
            <AppTopBarBackLink />
            <nav
              className="app-top-bar__exports"
              aria-label="Export digest"
            >
              <button
                type="button"
                className="app-top-bar__btn"
                disabled={pdfLoading}
                onClick={() => void exportPdf()}
              >
                {pdfLoading ? "Exporting PDF…" : "Export as PDF"}
              </button>
              <button
                type="button"
                className="app-top-bar__btn app-top-bar__btn--secondary"
                disabled={wordLoading}
                title="Download as Microsoft Word (.docx)"
                onClick={() => void exportWordDoc()}
              >
                {wordLoading ? "Exporting Word…" : "Export as Word"}
              </button>
            </nav>
          </>
        }
      />
      <div className="digest-wrap">
      <div className="digest-page-split digest-page-split--sticky-bar">
        <div className="digest-page-split__tabs">
          <div className="digest-tab-strip" role="tablist" aria-label="Digest sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`digest-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`digest-panel-${tab.id}`}
                className={`digest-tab-btn ${activeTab === tab.id ? "digest-tab-btn-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="digest-tab-text">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
            fontSize: "0.63rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--digest-title-sub)",
            marginBottom: "0.75rem",
          }}
        >
          Thread digest
        </div>
        <h1
          style={{
            fontFamily: "var(--font-lora), Georgia, serif",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 500,
            color: "var(--digest-title)",
            lineHeight: 1.25,
            marginBottom: "0.75rem",
          }}
        >
          {digest.title}
        </h1>
        <div
          style={{
            fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
            fontSize: "0.7rem",
            color: "var(--digest-muted)",
            letterSpacing: "0.05em",
          }}
        >
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
          />
        </div>
        <div className="digest-recap-align__rail" aria-hidden="true" />
      </div>

      <div
        id="digest-panel-story"
        role="tabpanel"
        className="digest-tab-panel digest-panel-story digest-panel-story--grid"
        hidden={activeTab !== "story"}
        aria-labelledby="digest-tab-story"
      >
        {flattenNarrativeForStory(digest.narrative).map((item, i) => (
          <StoryBlock
            key={`${item.kind}-${item.sourceIndex}`}
            item={item}
            visualIndex={i}
            threadId={threadId}
            messageIdsInOrder={messageIdsInOrder}
            participants={digest.participants}
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
        className="digest-tab-panel"
        hidden={activeTab !== "timeline"}
        aria-labelledby="digest-tab-timeline"
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
        className="digest-tab-panel digest-tab-panel--actions"
        hidden={activeTab !== "actions"}
        aria-labelledby="digest-tab-actions"
      >
        {digest.action_items.length > 0 ? (
          <div>
            <SectionLabel>Action items</SectionLabel>
            <ActionItems items={digest.action_items} />
          </div>
        ) : null}
        <div>
          <SectionLabel>Participants</SectionLabel>
          <Participants people={digest.participants} />
        </div>
      </div>

      <div
        style={{
          marginTop: "3.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--digest-border-strong)",
          fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
          fontSize: "0.65rem",
          color: "var(--digest-prose-faint)",
          letterSpacing: "0.08em",
          textAlign: "center",
        }}
      >
        Generated live · not stored on disk · your email stays in Google
      </div>

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
