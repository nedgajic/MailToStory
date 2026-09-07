"use client";

import { useEffect, useState } from "react";
import { simulatedGenerationPhase } from "@/lib/story-live-status";

const PIPELINE = [
  { id: "read", label: "Reading thread", emoji: "📬" },
  { id: "clean", label: "Tidying up", emoji: "🧹" },
  { id: "write", label: "Writing story", emoji: "✨" },
] as const;

function pipelineState(stepsDone: string[], index: number): "done" | "active" | "pending" {
  if (index === 0) return stepsDone.length >= 1 ? "done" : "active";
  if (index === 1) {
    if (stepsDone.length >= 2) return "done";
    if (stepsDone.length >= 1) return "active";
    return "pending";
  }
  return stepsDone.length >= 2 ? "active" : "pending";
}

type StoryGenerationCardProps = {
  subject: string;
  snippet: string;
  startedAt: string;
  compact?: boolean;
};

export function StoryGenerationCard({
  subject,
  snippet,
  startedAt,
  compact = false,
}: StoryGenerationCardProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 600);
    return () => window.clearInterval(id);
  }, []);

  const { stepsDone, statusLine, progressPct, indeterminate } = simulatedGenerationPhase(
    startedAt,
    nowMs,
  );

  return (
    <article
      className={`story-gen-card${compact ? " story-gen-card--compact" : ""}`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="story-gen-card__head">
        <div className="story-gen-card__pulse" aria-hidden />
        <div>
          <p className="story-gen-card__kicker">Creating story</p>
          <h3 className="story-gen-card__subject">{subject}</h3>
          {!compact && snippet ? (
            <p className="story-gen-card__snippet">{snippet}</p>
          ) : null}
        </div>
      </div>

      <p className="story-gen-card__status">{statusLine}</p>

      <div
        className={`story-gen-card__progress${indeterminate ? " story-gen-card__progress--indeterminate" : ""}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : progressPct}
        aria-label={`Story generation progress for ${subject}`}
      >
        <div
          className="story-gen-card__progress-fill"
          style={indeterminate ? undefined : { width: `${progressPct}%` }}
        />
      </div>

      <ol className="story-gen-card__pipeline">
        {PIPELINE.map((step, index) => {
          const state = pipelineState(stepsDone, index);
          return (
            <li
              key={step.id}
              className={`story-gen-card__step story-gen-card__step--${state}`}
            >
              <span className="story-gen-card__step-icon" aria-hidden>
                {state === "done" ? "✓" : step.emoji}
              </span>
              <span className="story-gen-card__step-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
