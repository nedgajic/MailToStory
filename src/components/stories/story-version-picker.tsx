"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryVersionSummary } from "@/lib/story-version-types";
import type { Digest } from "@/lib/digest-schema";
import { storyLengthLabel, type StoryLength } from "@/lib/story-length";
import { ToolbarVersionIcon } from "@/components/stories/story-toolbar-icons";

export function StoryVersionPicker({
  storyId,
  versions,
  activeVersionId,
  disabled = false,
  compact = false,
  onActivated,
}: {
  storyId: string;
  versions: StoryVersionSummary[];
  activeVersionId: string | null;
  disabled?: boolean;
  compact?: boolean;
  onActivated: (payload: {
    digest: Digest;
    messageIdsInOrder: string[];
    storyLength: StoryLength;
    activeVersionId: string;
    versions: StoryVersionSummary[];
  }) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active =
    versions.find((v) => v.id === activeVersionId) ?? versions[0] ?? null;

  useEffect(() => {
    if (!menuOpen) return;

    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (versions.length <= 1) return null;

  async function activate(versionId: string) {
    if (versionId === activeVersionId) {
      setMenuOpen(false);
      return;
    }
    setError(null);
    setBusyId(versionId);
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/stories/${storyId}/versions/${versionId}/activate`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        digest?: Digest;
        messageIdsInOrder?: string[];
        storyLength?: StoryLength;
        activeVersionId?: string;
      };
      if (!res.ok || !data.digest || !data.activeVersionId) {
        setError(data.error || "Could not switch version.");
        return;
      }
      const ids = Array.isArray(data.messageIdsInOrder)
        ? data.messageIdsInOrder.filter((x): x is string => typeof x === "string")
        : [];
      const nextVersions = versions.map((v) => ({
        ...v,
        isActive: v.id === data.activeVersionId,
      }));
      onActivated({
        digest: data.digest,
        messageIdsInOrder: ids,
        storyLength: data.storyLength ?? "normal",
        activeVersionId: data.activeVersionId,
        versions: nextVersions,
      });
    } finally {
      setBusyId(null);
    }
  }

  const activeLengthLabel = active ? storyLengthLabel(active.storyLength) : null;

  return (
    <div
      ref={menuRef}
      className="story-export-actions story-page-toolbar__menu-wrap story-version-picker"
    >
      <button
        type="button"
        className={
          compact
            ? `story-page-toolbar__icon-btn story-page-toolbar__icon-btn--badge${menuOpen ? " story-page-toolbar__icon-btn--open" : ""}${busyId ? " story-page-toolbar__icon-btn--loading" : ""}`
            : `story-export-actions__btn story-export-actions__trigger${menuOpen ? " story-export-actions__trigger--open" : ""}${busyId ? " story-export-actions__btn--loading" : ""}`
        }
        title={
          active
            ? `Version ${active.versionNumber}, ${activeLengthLabel}`
            : "Story versions"
        }
        aria-label={
          active
            ? `Story version ${active.versionNumber}, ${activeLengthLabel}`
            : "Story versions"
        }
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={disabled || Boolean(busyId)}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {busyId ? (
          <>
            <span className="story-export-actions__spinner" aria-hidden />
            {compact ? null : "Switching…"}
          </>
        ) : compact ? (
          <>
            <ToolbarVersionIcon />
            {active ? (
              <span className="story-page-toolbar__icon-badge" aria-hidden>
                v{active.versionNumber}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span className="story-version-picker__trigger-label">
              v{active?.versionNumber ?? 1}
              {activeLengthLabel ? (
                <span className="story-version-picker__trigger-length">
                  {activeLengthLabel}
                </span>
              ) : null}
            </span>
            <svg
              className="story-export-actions__chevron"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </>
        )}
      </button>

      {menuOpen ? (
        <div
          className="story-page-toolbar__menu story-export-actions__menu story-version-picker__menu"
          role="menu"
          aria-label="Story versions"
        >
          <div className="story-regenerate__intro">
            <p className="story-regenerate__intro-title">Switch version</p>
            <p className="story-regenerate__intro-credits">No credits used</p>
          </div>
          {versions.map((version) => {
            const lengthLabel = storyLengthLabel(version.storyLength);
            const selected = version.id === activeVersionId;
            return (
              <button
                key={version.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`story-page-toolbar__menu-item story-export-actions__menu-item story-regenerate__item story-version-picker__item${selected ? " story-version-picker__item--selected" : ""}`}
                onClick={() => void activate(version.id)}
              >
                <span className="story-regenerate__item-head">
                  <span className="story-regenerate__item-title">
                    <span className="story-regenerate__item-label">
                      Version {version.versionNumber}
                    </span>
                  </span>
                  <span className="story-length-badge">{lengthLabel}</span>
                </span>
                <span className="story-regenerate__item-hint">
                  {new Date(version.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="story-regenerate__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
