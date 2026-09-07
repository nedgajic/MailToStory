"use client";

import { BRAND_NAME } from "@/lib/brand";

const PIPELINE = [
  {
    id: "gmail",
    emoji: "📬",
    title: "Reading your thread",
    hint: "Collecting every reply from the conversation",
  },
  {
    id: "prompt",
    emoji: "🧹",
    title: "Tidying things up",
    hint: "Trimming signatures and quoted text",
  },
  {
    id: "generate",
    emoji: "✨",
    title: "Writing your story",
    hint: "Turning emails into something readable",
  },
] as const;

function activeTip(stepsDone: string[], working: boolean): string {
  if (working) {
    return "The story is taking shape — this is the fun part. Perfect time for a quick stretch.";
  }
  if (stepsDone.length >= 2) {
    return "Almost there! Your calm, readable story is nearly ready.";
  }
  if (stepsDone.length >= 1) {
    return "Thread cleaned up. Next up: weaving it into a narrative.";
  }
  return "Long threads need a little extra love — we read the whole conversation, not just the last note.";
}

function pipelineFromSteps(stepsDone: string[]) {
  return PIPELINE.map((step, index) => {
    let state: "done" | "active" | "pending" = "pending";
    if (index === 0) {
      state = stepsDone.length >= 1 ? "done" : "active";
    } else if (index === 1) {
      if (stepsDone.length >= 2) state = "done";
      else if (stepsDone.length >= 1) state = "active";
    } else if (stepsDone.length >= 2) {
      state = "active";
    }
    return { ...step, state };
  });
}

type DigestLoadingScreenProps = {
  statusLine: string;
  stepsDone: string[];
  working: { label: string; chars: number } | null;
  progressPct: number;
  indeterminate: boolean;
};

export function DigestLoadingScreen({
  statusLine,
  stepsDone,
  working,
  progressPct,
  indeterminate,
}: DigestLoadingScreenProps) {
  const pipeline = pipelineFromSteps(stepsDone);
  const charCount = working?.chars ?? 0;
  const tip = activeTip(stepsDone, Boolean(working));

  return (
    <div className="digest-loading">
      <div className="digest-loading__bg" aria-hidden>
        <div className="digest-loading__orb digest-loading__orb--a" />
        <div className="digest-loading__orb digest-loading__orb--b" />
        <div className="digest-loading__orb digest-loading__orb--c" />
        <div className="digest-loading__confetti" />
      </div>

      <div className="digest-loading__card">
        <div className="digest-loading__visual" aria-hidden>
          <div className="digest-loading__sparkles">
            <span className="digest-loading__sparkle digest-loading__sparkle--1">✦</span>
            <span className="digest-loading__sparkle digest-loading__sparkle--2">✧</span>
            <span className="digest-loading__sparkle digest-loading__sparkle--3">✦</span>
          </div>

          <div className="digest-loading__thread-stack">
            <span className="digest-loading__bubble digest-loading__bubble--1" />
            <span className="digest-loading__bubble digest-loading__bubble--2" />
            <span className="digest-loading__bubble digest-loading__bubble--3" />
          </div>

          <div className="digest-loading__stream" aria-hidden>
            <span className="digest-loading__stream-dot digest-loading__stream-dot--1" />
            <span className="digest-loading__stream-dot digest-loading__stream-dot--2" />
            <span className="digest-loading__stream-dot digest-loading__stream-dot--3" />
          </div>

          <div className="digest-loading__doc">
            <div className="digest-loading__doc-tabs">
              <div className="digest-loading__doc-tab digest-loading__doc-tab--story digest-loading__doc-tab--on">
                Story
              </div>
              <div className="digest-loading__doc-tab digest-loading__doc-tab--timeline">
                Timeline
              </div>
              <div className="digest-loading__doc-tab digest-loading__doc-tab--actions">
                Actions
              </div>
            </div>
            <div className="digest-loading__doc-lines">
              <span />
              <span />
              <span className="digest-loading__doc-lines-short" />
            </div>
          </div>
        </div>

        <p className="digest-loading__kicker">{BRAND_NAME}</p>
        <h2 className="digest-loading__title">Cooking up your story</h2>
        <p className="digest-loading__status" key={statusLine}>
          {statusLine}
        </p>

        <div
          className={`digest-loading__progress${indeterminate ? " digest-loading__progress--indeterminate" : ""}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate ? undefined : progressPct}
          aria-label="Story generation progress"
        >
          <div
            className="digest-loading__progress-fill"
            style={indeterminate ? undefined : { width: `${progressPct}%` }}
          />
        </div>

        <ol className="digest-loading__pipeline">
          {pipeline.map((step, index) => (
            <li
              key={step.id}
              className={`digest-loading__step digest-loading__step--${step.state} digest-loading__step--${step.id}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <span className="digest-loading__step-icon" aria-hidden>
                {step.state === "done" ? (
                  <span className="digest-loading__step-check" title="Done">
                    ✓
                  </span>
                ) : step.state === "active" ? (
                  <span className="digest-loading__step-emoji digest-loading__step-emoji--active">
                    {step.emoji}
                  </span>
                ) : (
                  <span className="digest-loading__step-emoji">{step.emoji}</span>
                )}
              </span>
              <span className="digest-loading__step-body">
                <span className="digest-loading__step-title">{step.title}</span>
                <span className="digest-loading__step-hint">{step.hint}</span>
              </span>
              {step.state === "active" ? (
                <span className="digest-loading__step-pulse" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="digest-loading__sr-only" aria-live="polite">
          {stepsDone.map((label) => (
            <span key={label}>Completed: {label}. </span>
          ))}
        </div>

        {charCount > 0 ? (
          <p className="digest-loading__chars" aria-live="polite">
            <span className="digest-loading__chars-value">
              {charCount.toLocaleString()}
            </span>{" "}
            characters composed so far
          </p>
        ) : null}

        <p className="digest-loading__tip" key={tip}>
          {tip}
        </p>
      </div>
    </div>
  );
}
