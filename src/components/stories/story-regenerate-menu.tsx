"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Digest } from "@/lib/digest-schema";
import {
  STORY_LENGTH_OPTIONS,
  type StoryLength,
} from "@/lib/story-length";
import {
  findLatestVersionForLength,
  type StoryVersionSummary,
} from "@/lib/story-version-types";
import { RegenerateDuplicateModal } from "@/components/stories/regenerate-duplicate-modal";
import { ToolbarRegenerateIcon } from "@/components/stories/story-toolbar-icons";

type RegeneratedPayload = {
  digest: Digest;
  messageIdsInOrder: string[];
  storyLength: StoryLength;
  activeVersionId?: string | null;
  versions?: StoryVersionSummary[];
};

export function StoryRegenerateMenu({
  storyId,
  conversationId,
  storyLength,
  versions,
  canUseElaborate,
  creditsRemainingLabel,
  disabled = false,
  compact = false,
  onRegenerated,
  onVersionActivated,
}: {
  storyId: string;
  conversationId: string;
  storyLength: StoryLength;
  versions: StoryVersionSummary[];
  canUseElaborate: boolean;
  creditsRemainingLabel: string | null;
  disabled?: boolean;
  compact?: boolean;
  onRegenerated: (payload: RegeneratedPayload) => void;
  onVersionActivated: (payload: {
    digest: Digest;
    messageIdsInOrder: string[];
    storyLength: StoryLength;
    activeVersionId: string;
    versions: StoryVersionSummary[];
  }) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyLength, setBusyLength] = useState<StoryLength | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    length: StoryLength;
    existing: StoryVersionSummary;
  } | null>(null);

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

  async function activateVersion(versionId: string, length: StoryLength) {
    setError(null);
    setBusyLength(length);
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
      const nextVersions = versions.map((version) => ({
        ...version,
        isActive: version.id === data.activeVersionId,
      }));
      onVersionActivated({
        digest: data.digest,
        messageIdsInOrder: ids,
        storyLength: data.storyLength ?? length,
        activeVersionId: data.activeVersionId,
        versions: nextVersions,
      });
      setDuplicatePrompt(null);
    } finally {
      setBusyLength(null);
    }
  }

  async function regenerate(length: StoryLength, skipDuplicateCheck = false) {
    if (length === "elaborate" && !canUseElaborate) return;

    if (!skipDuplicateCheck) {
      const existing = findLatestVersionForLength(versions, length);
      if (existing) {
        setMenuOpen(false);
        setDuplicatePrompt({ length, existing });
        return;
      }
    }

    setError(null);
    setBusyLength(length);
    setMenuOpen(false);
    setDuplicatePrompt(null);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, length }),
      });
      const data = (await res.json()) as {
        error?: string;
        digest?: Digest;
        messageIdsInOrder?: string[];
        storyLength?: StoryLength;
        activeVersionId?: string | null;
        versions?: StoryVersionSummary[];
      };
      if (!res.ok || !data.digest) {
        setError(data.error || "Could not regenerate story.");
        return;
      }
      const ids = Array.isArray(data.messageIdsInOrder)
        ? data.messageIdsInOrder.filter((x): x is string => typeof x === "string")
        : [];
      onRegenerated({
        digest: data.digest,
        messageIdsInOrder: ids,
        storyLength: data.storyLength ?? length,
        activeVersionId: data.activeVersionId,
        versions: data.versions,
      });
    } finally {
      setBusyLength(null);
    }
  }

  const loading = busyLength !== null;

  return (
    <>
      <div
        ref={menuRef}
        className="story-export-actions story-page-toolbar__menu-wrap story-regenerate"
      >
        <button
          type="button"
          className={
            compact
              ? `story-page-toolbar__icon-btn${menuOpen ? " story-page-toolbar__icon-btn--open" : ""}${loading ? " story-page-toolbar__icon-btn--loading" : ""}`
              : `story-export-actions__btn story-export-actions__trigger${menuOpen ? " story-export-actions__trigger--open" : ""}${loading ? " story-export-actions__btn--loading" : ""}`
          }
          title="Regenerate story"
          aria-label="Regenerate story"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={disabled || loading}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {loading ? (
            <>
              <span className="story-export-actions__spinner" aria-hidden />
              {compact ? null : "Regenerating…"}
            </>
          ) : compact ? (
            <ToolbarRegenerateIcon />
          ) : (
            <>
              Regenerate
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
            className="story-page-toolbar__menu story-export-actions__menu story-regenerate__menu"
            role="menu"
            aria-label="Regenerate length options"
          >
            <div className="story-regenerate__intro">
              <p className="story-regenerate__intro-title">
                Rebuild at a different length
              </p>
              {creditsRemainingLabel ? (
                <p className="story-regenerate__intro-credits">
                  {creditsRemainingLabel} credits left this month
                </p>
              ) : null}
            </div>
            {STORY_LENGTH_OPTIONS.map((option) => {
              const locked = option.proOnly && !canUseElaborate;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  aria-disabled={locked}
                  disabled={locked}
                  className={`story-page-toolbar__menu-item story-export-actions__menu-item story-regenerate__item${locked ? " story-regenerate__item--locked" : ""}`}
                  onClick={() => void regenerate(option.id)}
                >
                  <span className="story-regenerate__item-head">
                    <span className="story-regenerate__item-title">
                      <span className="story-regenerate__item-label">{option.label}</span>
                      {option.proOnly ? (
                        <span className="story-regenerate__pro-badge">Pro</span>
                      ) : null}
                    </span>
                    <span className="story-length-badge">{option.creditLabel}</span>
                  </span>
                  <span className="story-regenerate__item-hint">{option.hint}</span>
                  {locked ? (
                    <span className="story-regenerate__upgrade">
                      <Link href="/settings/billing">Upgrade to Pro</Link>
                    </span>
                  ) : null}
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

      {duplicatePrompt ? (
        <RegenerateDuplicateModal
          open
          length={duplicatePrompt.length}
          existingVersion={duplicatePrompt.existing}
          busy={loading}
          onCancel={() => setDuplicatePrompt(null)}
          onSwitch={() =>
            duplicatePrompt.existing.isActive
              ? setDuplicatePrompt(null)
              : void activateVersion(duplicatePrompt.existing.id, duplicatePrompt.length)
          }
          onRegenerateAnyway={() => void regenerate(duplicatePrompt.length, true)}
        />
      ) : null}
    </>
  );
}
