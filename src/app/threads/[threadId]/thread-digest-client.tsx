"use client";

import type { Digest } from "@/lib/digest-schema";
import { AppTopBar, AppTopBarBackLink } from "@/components/app-top-bar";
import DigestRenderer from "@/components/digest/DigestRenderer";
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
  | { type: "error"; message: string };

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
            const data: { error?: string } = await res.json();
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
                  : { label: "Generating digest…", chars: msg.chars },
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
              throw new Error(msg.message);
            }
          }
        }

        if (!cancelled && !receivedDone) {
          throw new Error("Stream ended without a digest.");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId]);

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
            padding: "1.5rem 1rem 2rem",
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: "1.15rem",
              fontWeight: 500,
              marginBottom: "1rem",
              color: "var(--app-text)",
            }}
          >
            Preparing your digest
          </h2>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate ? undefined : progressPct}
          aria-label="Digest generation progress"
          style={{
            height: "8px",
            background: "var(--digest-progress-track)",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "1rem",
          }}
        >
          {indeterminate ? (
            <div className="digest-progress-indeterminate" />
          ) : (
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "#1d3557",
                borderRadius: "4px",
                transition: "width 0.35s ease-out",
              }}
            />
          )}
        </div>

        <p
          style={{
            fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
            fontSize: "0.82rem",
            color: "var(--app-text-muted)",
            lineHeight: 1.6,
            margin: "0 0 1.25rem",
          }}
        >
          {statusLine}
        </p>

        <ul
          style={{
            margin: 0,
            padding: "0 0 0 1.1rem",
            fontSize: "0.9rem",
            lineHeight: 1.85,
            color: "var(--digest-prose)",
          }}
        >
          {stepsDone.map((label) => (
            <li key={label} style={{ marginBottom: "0.25rem" }}>
              <span style={{ color: "#2d6a4f", marginRight: "0.35rem" }}>
                ✓
              </span>
              {label}
            </li>
          ))}
        </ul>

        {working && working.chars > 0 ? (
          <p
            style={{
              margin: "1rem 0 0",
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontSize: "0.72rem",
              color: "var(--digest-prose-softer)",
            }}
          >
            {working.chars.toLocaleString()} characters from the model so far…
          </p>
        ) : null}

        <style>{`
          @keyframes digestProgressIndeterminate {
            0% { transform: translateX(-100%); width: 40%; }
            100% { transform: translateX(350%); width: 40%; }
          }
          .digest-progress-indeterminate {
            height: 100%;
            width: 40%;
            background: #1d3557;
            border-radius: 4px;
            animation: digestProgressIndeterminate 1.2s ease-in-out infinite;
          }
        `}</style>
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
        <div style={{ padding: "1.5rem 1rem", maxWidth: 680, margin: "0 auto" }}>
          <p style={{ color: "#b00020" }}>{error}</p>
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
