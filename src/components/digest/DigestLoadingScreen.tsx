"use client";

import { BRAND_NAME } from "@/lib/brand";

const PIPELINE = [
  {
    id: "gmail",
    title: "Read thread",
    hint: "Pulling messages from Gmail",
  },
  {
    id: "prompt",
    title: "Prepare context",
    hint: "Cleaning quotes and building the prompt",
  },
  {
    id: "generate",
    title: "Write story",
    hint: "Story, timeline, and open actions",
  },
] as const;

function activeTip(stepsDone: string[], working: boolean): string {
  if (working) {
    return "The model is drafting story beats, timeline entries, and open actions.";
  }
  if (stepsDone.length >= 2) {
    return "Almost there — composing your readable story now.";
  }
  if (stepsDone.length >= 1) {
    return "Stripping signatures and quoted replies so the model sees the real thread.";
  }
  return "Long threads take longer — we read every turn, not just the last reply.";
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
        <div className="digest-loading__grid" />
      </div>

      <div className="digest-loading__card">
        <div className="digest-loading__visual" aria-hidden>
          <div className="digest-loading__thread-stack">
            <span className="digest-loading__bubble digest-loading__bubble--1" />
            <span className="digest-loading__bubble digest-loading__bubble--2" />
            <span className="digest-loading__bubble digest-loading__bubble--3" />
          </div>
          <div className="digest-loading__stream">
            <span className="digest-loading__stream-dot" />
            <span className="digest-loading__stream-dot" />
            <span className="digest-loading__stream-dot" />
          </div>
          <div className="digest-loading__doc">
            <div className="digest-loading__doc-tab digest-loading__doc-tab--on">
              Story
            </div>
            <div className="digest-loading__doc-tab">Timeline</div>
            <div className="digest-loading__doc-tab">Actions</div>
            <div className="digest-loading__doc-lines">
              <span />
              <span />
              <span className="digest-loading__doc-lines-short" />
            </div>
          </div>
        </div>

        <p className="digest-loading__kicker">{BRAND_NAME}</p>
        <h2 className="digest-loading__title">Preparing your story</h2>
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
              className={`digest-loading__step digest-loading__step--${step.state}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <span className="digest-loading__step-icon" aria-hidden>
                {step.state === "done" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : step.state === "active" ? (
                  <span className="digest-loading__spinner" />
                ) : (
                  <span className="digest-loading__step-dot" />
                )}
              </span>
              <span className="digest-loading__step-body">
                <span className="digest-loading__step-title">{step.title}</span>
                <span className="digest-loading__step-hint">{step.hint}</span>
              </span>
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
            characters composed
          </p>
        ) : null}

        <p className="digest-loading__tip" key={tip}>
          {tip}
        </p>
      </div>
    </div>
  );
}
