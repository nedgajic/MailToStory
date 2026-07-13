"use client";

import type { Digest } from "@/lib/digest-schema";
import { DigestErrorPanel } from "@/components/digest/DigestErrorPanel";
import { DigestLoadingScreen } from "@/components/digest/DigestLoadingScreen";
import DigestRenderer from "@/components/digest/DigestRenderer";
import { ReconnectGooglePanel } from "@/components/reconnect-google-panel";
import {
  ThreadPreviewPanel,
  type ThreadPreview,
} from "@/components/thread/ThreadPreviewPanel";
import {
  formatUserFacingError,
  type UserFacingError,
} from "@/lib/user-facing-error";
import { useEffect, useMemo, useState } from "react";

type StreamMsg =
  | { type: "step_done"; label: string }
  | { type: "working"; label: string; chars: number }
  | { type: "progress"; chars: number }
  | {
      type: "done";
      digest: Digest;
      messageIdsInOrder?: string[];
    }
  | ({
      type: "error";
    } & UserFacingError);

function parseSseBlocks(buffer: string): { messages: StreamMsg[]; rest: string } {
  const messages: StreamMsg[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const block of parts) {
    const lines = block.split("\n").filter(Boolean);
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      try {
        messages.push(JSON.parse(raw) as StreamMsg);
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
  return { messages, rest };
}

function deriveProgressPct(
  stepsDone: string[],
  working: { label: string; chars: number } | null,
): number {
  let pct = 8;
  if (stepsDone.length >= 1) pct = 28;
  if (stepsDone.length >= 2) pct = 42;
  if (working && working.chars > 0) {
    pct = Math.min(94, 42 + Math.min(52, Math.floor(working.chars / 90)));
  } else if (stepsDone.length >= 2 && working) {
    pct = 48;
  }
  return pct;
}

export type ThreadWorkspacePhase =
  | "idle"
  | "preview-loading"
  | "preview"
  | "generating"
  | "story"
  | "error";

export type ThreadWorkspaceProps = {
  threadId: string;
  embedded?: boolean;
  onClose?: () => void;
  onPhaseChange?: (phase: ThreadWorkspacePhase) => void;
};

export function ThreadWorkspace({
  threadId,
  embedded = false,
  onClose,
  onPhaseChange,
}: ThreadWorkspaceProps) {
  const [preview, setPreview] = useState<ThreadPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<UserFacingError | null>(null);
  const [needsGoogleReconnect, setNeedsGoogleReconnect] = useState(false);
  const [previewRetryCount, setPreviewRetryCount] = useState(0);

  const [digest, setDigest] = useState<Digest | null>(null);
  const [messageIdsInOrder, setMessageIdsInOrder] = useState<string[]>([]);
  const [digestError, setDigestError] = useState<UserFacingError | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [stepsDone, setStepsDone] = useState<string[]>([]);
  const [statusLine, setStatusLine] = useState("Starting…");
  const [working, setWorking] = useState<{
    label: string;
    chars: number;
  } | null>(null);

  const progressPct = useMemo(
    () => deriveProgressPct(stepsDone, working),
    [stepsDone, working],
  );

  useEffect(() => {
    if (!onPhaseChange) return;
    if (digest && !digestLoading && !digestError) {
      onPhaseChange("story");
    } else if (digestLoading) {
      onPhaseChange("generating");
    } else if (digestError) {
      onPhaseChange("error");
    } else if (previewLoading) {
      onPhaseChange("preview-loading");
    } else if (needsGoogleReconnect || previewError) {
      onPhaseChange("error");
    } else if (preview) {
      onPhaseChange("preview");
    } else {
      onPhaseChange("idle");
    }
  }, [
    digest,
    digestLoading,
    digestError,
    previewLoading,
    preview,
    previewError,
    needsGoogleReconnect,
    onPhaseChange,
  ]);

  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
    setNeedsGoogleReconnect(false);
    setGenerateCount(0);
    setDigest(null);
    setDigestError(null);
    setDigestLoading(false);
  }, [threadId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      setNeedsGoogleReconnect(false);
      setPreview(null);

      try {
        const res = await fetch(
          `/api/thread-preview?threadId=${encodeURIComponent(threadId)}`,
          { credentials: "include" },
        );

        const data: ThreadPreview & {
          error?: string;
          code?: string;
          title?: string;
          message?: string;
          hint?: string;
          canRetry?: boolean;
        } = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          if (data.code === "GOOGLE_RECONNECT_REQUIRED") {
            setNeedsGoogleReconnect(true);
            return;
          }
          if (data.title && data.message) {
            setPreviewError({
              title: data.title,
              message: data.message,
              hint: data.hint,
              canRetry: data.canRetry ?? true,
            });
            return;
          }
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        setPreview(data);
      } catch (e) {
        if (!cancelled) {
          setPreviewError(formatUserFacingError(e));
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, previewRetryCount]);

  useEffect(() => {
    if (generateCount === 0) return;

    let cancelled = false;

    (async () => {
      setDigestLoading(true);
      setDigestError(null);
      setDigest(null);
      setMessageIdsInOrder([]);
      setStepsDone([]);
      setStatusLine("Connecting…");
      setWorking(null);

      try {
        const res = await fetch("/api/digest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ threadId, stream: true }),
          credentials: "include",
        });

        if (res.status === 401) {
          throw new Error("Unauthorized — sign in again.");
        }

        const ct = res.headers.get("content-type") ?? "";

        if (!res.ok) {
          if (ct.includes("application/json")) {
            const data: {
              error?: string;
              title?: string;
              message?: string;
              hint?: string;
              canRetry?: boolean;
            } = await res.json();
            if (data.title && data.message) {
              setDigestError({
                title: data.title,
                message: data.message,
                hint: data.hint,
                canRetry: data.canRetry ?? true,
              });
              setDigestLoading(false);
              return;
            }
            throw new Error(data.error || `Request failed (${res.status})`);
          }
          throw new Error(`Request failed (${res.status})`);
        }

        if (!ct.includes("text/event-stream") || !res.body) {
          throw new Error("Expected event stream from server.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedDone = false;

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { messages, rest } = parseSseBlocks(buffer);
          buffer = rest;

          for (const msg of messages) {
            if (cancelled) break;
            if (msg.type === "step_done") {
              setStepsDone((prev) => [...prev, msg.label]);
              setWorking(null);
              setStatusLine(msg.label);
            } else if (msg.type === "working") {
              setWorking({ label: msg.label, chars: msg.chars });
              setStatusLine(msg.label);
            } else if (msg.type === "progress") {
              setWorking((w) =>
                w
                  ? { ...w, chars: msg.chars }
                  : { label: "Generating story…", chars: msg.chars },
              );
            } else if (msg.type === "done") {
              receivedDone = true;
              setDigest(msg.digest);
              setMessageIdsInOrder(msg.messageIdsInOrder ?? []);
              setDigestLoading(false);
              setWorking(null);
              setStatusLine("Done");
              return;
            } else if (msg.type === "error") {
              setDigestError({
                title: msg.title,
                message: msg.message,
                hint: msg.hint,
                canRetry: msg.canRetry,
              });
              setDigestLoading(false);
              return;
            }
          }
        }

        if (!cancelled && !receivedDone) {
          throw new Error("Stream ended without a story.");
        }
      } catch (e) {
        if (!cancelled) {
          setDigestError(formatUserFacingError(e));
          setDigestLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, generateCount]);

  const shellClass = embedded
    ? "thread-workspace thread-workspace--embedded"
    : "thread-workspace thread-workspace--page thread-page-content";

  if (digest && !digestLoading && !digestError) {
    return (
      <div className={shellClass}>
        <DigestRenderer
          digest={digest}
          threadId={threadId}
          messageIdsInOrder={messageIdsInOrder}
          embedded={embedded}
          onClose={onClose}
        />
      </div>
    );
  }

  if (digestLoading) {
    const indeterminate = stepsDone.length === 0 && !working;

    return (
      <div className={shellClass}>
        {embedded && onClose ? (
          <button
            type="button"
            className="inbox-detail-back"
            onClick={onClose}
          >
            ← Back to inbox
          </button>
        ) : null}
        <DigestLoadingScreen
          statusLine={statusLine}
          stepsDone={stepsDone}
          working={working}
          progressPct={progressPct}
          indeterminate={indeterminate}
        />
      </div>
    );
  }

  if (digestError) {
    return (
      <div className={shellClass}>
        {embedded && onClose ? (
          <button
            type="button"
            className="inbox-detail-back"
            onClick={onClose}
          >
            ← Back to inbox
          </button>
        ) : null}
        <DigestErrorPanel
          error={digestError}
          onRetry={
            digestError.canRetry
              ? () => {
                  setDigestError(null);
                  setGenerateCount((n) => n + 1);
                }
              : undefined
          }
        />
      </div>
    );
  }

  if (previewLoading) {
    return (
      <div className={shellClass}>
        {embedded && onClose ? (
          <button
            type="button"
            className="inbox-detail-back"
            onClick={onClose}
          >
            ← Back to inbox
          </button>
        ) : null}
        <div className="thread-preview-loading" aria-busy="true">
          <div className="thread-preview-loading__spinner" aria-hidden="true" />
          <p>Loading message preview…</p>
        </div>
      </div>
    );
  }

  if (needsGoogleReconnect) {
    return (
      <div className={shellClass}>
        <ReconnectGooglePanel />
      </div>
    );
  }

  if (previewError) {
    return (
      <div className={shellClass}>
        {embedded && onClose ? (
          <button
            type="button"
            className="inbox-detail-back"
            onClick={onClose}
          >
            ← Back to inbox
          </button>
        ) : null}
        <DigestErrorPanel
          error={previewError}
          onRetry={
            previewError.canRetry
              ? () => {
                  setPreviewError(null);
                  setPreviewRetryCount((n) => n + 1);
                }
              : undefined
          }
        />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className={shellClass}>
      {embedded && onClose ? (
        <button type="button" className="inbox-detail-back" onClick={onClose}>
          ← Back to inbox
        </button>
      ) : null}
      <ThreadPreviewPanel
        preview={preview}
        generating={false}
        onGenerate={() => setGenerateCount((n) => n + 1)}
      />
    </div>
  );
}
