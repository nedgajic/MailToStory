"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/billing/plans";
import {
  STORY_LENGTH_OPTIONS,
  type StoryLength,
} from "@/lib/story-length";

export function StoryDefaultLengthForm({
  initialLength,
  canUseElaborate,
  canManage,
  plan,
}: {
  initialLength: StoryLength;
  canUseElaborate: boolean;
  canManage: boolean;
  plan: PlanId;
}) {
  const [length, setLength] = useState(initialLength);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save(next: StoryLength) {
    if (!canManage) return;
    setBusy(true);
    setError(null);
    setSaved(null);
    const previous = length;
    setLength(next);
    try {
      const res = await fetch("/api/settings/story-defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultStoryLength: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLength(previous);
        setError(data.error || "Could not update default length.");
        return;
      }
      setSaved("Default story length saved.");
    } catch {
      setLength(previous);
      setError("Could not update default length.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dash-panel">
      <h2 className="dash-panel__section-title">Story generation</h2>
      <p className="dash-muted">
        Default length for new stories when mail is forwarded in. Manual regenerates
        still let you pick each time. Costs are in credits per generation.
      </p>
      <div className="story-default-length">
        {STORY_LENGTH_OPTIONS.map((option) => {
          const locked = option.proOnly && !canUseElaborate;
          const selected = option.id === length;
          return (
            <label
              key={option.id}
              className={`story-default-length__option${selected ? " story-default-length__option--selected" : ""}${locked ? " story-default-length__option--locked" : ""}`}
            >
              <input
                type="radio"
                name="defaultStoryLength"
                value={option.id}
                checked={selected}
                disabled={!canManage || busy || locked}
                onChange={() => void save(option.id)}
              />
              <span className="story-default-length__copy">
                <span className="story-default-length__label">
                  {option.label}
                  <span className="story-default-length__credit">{option.creditLabel}</span>
                </span>
                <span className="story-default-length__hint">{option.hint}</span>
                {locked ? (
                  <span className="story-default-length__locked">Pro plan required</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {!canManage ? (
        <p className="dash-muted">Only workspace admins can change this setting.</p>
      ) : null}
      {plan === "free" ? (
        <p className="dash-muted">
          Free includes 5 credits per month (about five Normal-length stories).
        </p>
      ) : null}
      {error ? <p className="auth-form__error">{error}</p> : null}
      {saved ? <p className="dash-banner__feedback">{saved}</p> : null}
    </section>
  );
}
