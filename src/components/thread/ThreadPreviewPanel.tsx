"use client";

import type { ThreadPreviewMessage } from "@/lib/threadMessagePreview";
import { parseFromDisplayName } from "@/lib/parseFromHeader";
import { useEffect, useState } from "react";

function formatPreviewDate(rfc2822: string): string {
  const raw = rfc2822.trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortPreviewDate(rfc2822: string): string {
  const raw = rfc2822.trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function senderLabel(from: string): string {
  const label = parseFromDisplayName(from);
  if (label === "(unknown)") return "Unknown sender";
  return label;
}

export type ThreadPreview = {
  threadId: string;
  subject: string;
  messageCount: number;
  messages: ThreadPreviewMessage[];
};

type ThreadPreviewPanelProps = {
  preview: ThreadPreview;
  onGenerate: () => void;
  generating: boolean;
};

function ThreadPreviewMessageBody({ message }: { message: ThreadPreviewMessage }) {
  if (message.bodyHtml?.trim()) {
    return (
      <div
        className="digest-original-html thread-preview__body"
        dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
      />
    );
  }

  return (
    <pre className="thread-preview__body thread-preview__body--text">
      {message.body.trim() || "No message body."}
    </pre>
  );
}

function ThreadPreviewMessageCard({
  message,
  index,
  messageCount,
  panelId,
  labelledBy,
}: {
  message: ThreadPreviewMessage;
  index: number;
  messageCount: number;
  panelId?: string;
  labelledBy?: string;
}) {
  return (
    <article
      className="thread-preview__message"
      {...(panelId
        ? {
            id: panelId,
            role: "tabpanel" as const,
            "aria-labelledby": labelledBy,
          }
        : {})}
    >
      <div className="thread-preview__message-header">
        <span className="thread-preview__message-index">
          Message {index + 1} of {messageCount}
        </span>
        {message.from ? (
          <span className="thread-preview__from">{message.from}</span>
        ) : null}
        {message.date ? (
          <span className="thread-preview__date">
            {formatPreviewDate(message.date)}
          </span>
        ) : null}
      </div>
      <div className="thread-preview__body-wrap">
        <ThreadPreviewMessageBody message={message} />
      </div>
    </article>
  );
}

export function ThreadPreviewPanel({
  preview,
  onGenerate,
  generating,
}: ThreadPreviewPanelProps) {
  const isThread = preview.messageCount > 1;
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, preview.messages.length - 1),
  );

  useEffect(() => {
    setActiveIndex(Math.max(0, preview.messages.length - 1));
  }, [preview.threadId, preview.messages.length]);

  const activeMessage = preview.messages[activeIndex] ?? preview.messages[0];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < preview.messages.length - 1;

  return (
    <div
      className={
        isThread ? "thread-preview thread-preview--thread" : "thread-preview"
      }
    >
      <div className="thread-preview__header">
        <p className="thread-preview__kicker">
          {isThread
            ? `${preview.messageCount} messages in this thread`
            : "Message preview"}
        </p>
        <h1 className="thread-preview__subject">{preview.subject}</h1>
      </div>

      {isThread ? (
        <>
          <div className="thread-preview__message-nav">
            <p className="thread-preview__message-nav-label" id="thread-preview-tabs-label">
              Jump to message
            </p>
            <div
              className="thread-preview__message-tabs"
              role="tablist"
              aria-labelledby="thread-preview-tabs-label"
            >
              {preview.messages.map((message, index) => {
                const selected = index === activeIndex;
                const tabDate = shortPreviewDate(message.date);
                const tabSender = senderLabel(message.from);
                return (
                  <button
                    key={message.messageId}
                    type="button"
                    role="tab"
                    id={`thread-preview-tab-${index}`}
                    aria-selected={selected}
                    aria-controls={`thread-preview-panel-${index}`}
                    className={
                      selected
                        ? "thread-preview__message-tab thread-preview__message-tab--active"
                        : "thread-preview__message-tab"
                    }
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="thread-preview__message-tab-index">
                      {index + 1}
                    </span>
                    <span className="thread-preview__message-tab-text">
                      <span className="thread-preview__message-tab-sender">
                        {tabSender}
                      </span>
                      {tabDate ? (
                        <span className="thread-preview__message-tab-date">
                          {tabDate}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="thread-preview__message-stage">
            {activeMessage ? (
              <ThreadPreviewMessageCard
                message={activeMessage}
                index={activeIndex}
                messageCount={preview.messageCount}
                panelId={`thread-preview-panel-${activeIndex}`}
                labelledBy={`thread-preview-tab-${activeIndex}`}
              />
            ) : null}
          </div>

          <div className="thread-preview__message-pager">
            <button
              type="button"
              className="thread-preview__pager-btn"
              disabled={!canGoPrev}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            >
              ← Previous
            </button>
            <span className="thread-preview__pager-status" aria-live="polite">
              {activeIndex + 1} / {preview.messageCount}
            </span>
            <button
              type="button"
              className="thread-preview__pager-btn"
              disabled={!canGoNext}
              onClick={() =>
                setActiveIndex((i) =>
                  Math.min(preview.messages.length - 1, i + 1),
                )
              }
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <div className="thread-preview__message-stage thread-preview__message-stage--single">
          {activeMessage ? (
            <ThreadPreviewMessageCard
              message={activeMessage}
              index={0}
              messageCount={1}
            />
          ) : null}
        </div>
      )}

      <div className="thread-preview__actions">
        <button
          type="button"
          className="thread-preview__generate"
          onClick={onGenerate}
          disabled={generating}
        >
          {generating ? "Starting…" : "Generate story"}
        </button>
        <p className="thread-preview__hint">
          {isThread
            ? "Browse each message above, then generate a story from the full thread."
            : "We’ll turn this message into a story with timeline and actions."}
        </p>
      </div>
    </div>
  );
}
