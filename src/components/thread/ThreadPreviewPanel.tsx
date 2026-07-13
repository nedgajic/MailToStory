"use client";

import type { ThreadPreviewMessage } from "@/lib/threadMessagePreview";

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

export function ThreadPreviewPanel({
  preview,
  onGenerate,
  generating,
}: ThreadPreviewPanelProps) {
  const isThread = preview.messageCount > 1;
  const previewLabel = isThread
    ? `${preview.messageCount} messages in thread`
    : "Message";

  return (
    <div className="thread-preview">
      <div className="thread-preview__header">
        <p className="thread-preview__kicker">{previewLabel}</p>
        <h1 className="thread-preview__subject">{preview.subject}</h1>
      </div>

      <div className="thread-preview__messages-wrap">
        <ol className="thread-preview__messages">
          {preview.messages.map((message, index) => (
            <li key={message.messageId} className="thread-preview__message">
              <div className="thread-preview__message-header">
                <span className="thread-preview__message-index">
                  {index + 1}/{preview.messageCount}
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
            </li>
          ))}
        </ol>
      </div>

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
            ? "We’ll read this full thread and compose your story, timeline, and actions."
            : "We’ll turn this message into a story with timeline and actions."}
        </p>
      </div>
    </div>
  );
}
