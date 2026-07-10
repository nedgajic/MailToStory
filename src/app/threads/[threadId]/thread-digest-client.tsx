"use client";

import type { Digest } from "@/lib/digest-schema";
import { AppTopBar, AppTopBarBackLink } from "@/components/app-top-bar";
import { DigestErrorPanel } from "@/components/digest/DigestErrorPanel";
import { DigestLoadingScreen } from "@/components/digest/DigestLoadingScreen";
import DigestRenderer from "@/components/digest/DigestRenderer";
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

export function ThreadDigestClient({ threadId }: { threadId: string }) {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [messageIdsInOrder, setMessageIdsInOrder] = useState<string[]>([]);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
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
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
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
              setError({
                title: data.title,
                message: data.message,
                hint: data.hint,
                canRetry: data.canRetry ?? true,
              });
              setLoading(false);
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
              setLoading(false);
              setWorking(null);
              setStatusLine("Done");
              return;
            } else if (msg.type === "error") {
              setError({
                title: msg.title,
                message: msg.message,
                hint: msg.hint,
                canRetry: msg.canRetry,
              });
              setLoading(false);
              return;
            }
          }
        }

        if (!cancelled && !receivedDone) {
          throw new Error("Stream ended without a story.");
        }
      } catch (e) {
        if (!cancelled) {
          setError(formatUserFacingError(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, retryCount]);

  if (loading) {
    const indeterminate = stepsDone.length === 0 && !working;

    return (
      <div
        className="digest-page-shell"
        style={{ paddingTop: "var(--digest-export-bar-height)" }}
      >
        <AppTopBar
          contentMaxWidth="digest"
          startSlot={<AppTopBarBackLink />}
        />
        <div
          style={{
            padding: "1.25rem 1rem 2.5rem",
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          <DigestLoadingScreen
            statusLine={statusLine}
            stepsDone={stepsDone}
            working={working}
            progressPct={progressPct}
            indeterminate={indeterminate}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="digest-page-shell"
        style={{ paddingTop: "var(--digest-export-bar-height)" }}
      >
        <AppTopBar
          contentMaxWidth="digest"
          startSlot={<AppTopBarBackLink />}
        />
        <div style={{ padding: "1.5rem 1rem 2.5rem", maxWidth: 680, margin: "0 auto" }}>
          <DigestErrorPanel
            error={error}
            onRetry={
              error.canRetry
                ? () => {
                    setError(null);
                    setRetryCount((n) => n + 1);
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  if (!digest) return null;

  return (
    <div
      className="digest-page-shell"
      style={{ paddingTop: "var(--digest-export-bar-height)" }}
    >
      <DigestRenderer
        digest={digest}
        threadId={threadId}
        messageIdsInOrder={messageIdsInOrder}
      />
    </div>
  );
}
