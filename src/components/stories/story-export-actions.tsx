"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Digest } from "@/lib/digest-schema";
import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import {
  readExportAlwaysDayMode,
  readStoryColorMode,
  resolveExportColorMode,
  writeExportAlwaysDayMode,
} from "@/lib/story-reading-theme";
import { DigestExportPdfOverlay } from "@/components/digest/DigestExportPdfOverlay";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";
import { digestToMarkdown } from "@/lib/digestToMarkdown";
import { openPdfInNewTab } from "@/lib/openPdfInNewTab";
import { ToolbarExportIcon } from "@/components/stories/story-toolbar-icons";

export function StoryExportActions({
  digest,
  displayTheme = "dossier",
  colorMode,
  className,
  compact = false,
}: {
  digest: Digest;
  displayTheme?: StoryDisplayTheme;
  colorMode?: StoryColorMode;
  className?: string;
  compact?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [alwaysDayMode, setAlwaysDayMode] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    title: string;
    filename: string;
  } | null>(null);

  useEffect(() => {
    setAlwaysDayMode(readExportAlwaysDayMode());
  }, []);

  const currentColorMode = colorMode ?? readStoryColorMode();
  const exportColorMode = resolveExportColorMode(
    currentColorMode,
    alwaysDayMode,
  );
  const showExportDayModeToggle = currentColorMode === "dark";

  const closePdfPreview = useCallback(() => {
    setPdfPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview?.url]);

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

  async function copyMarkdown() {
    const md = digestToMarkdown(digest);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
      } else {
        const ta = document.createElement("textarea");
        ta.value = md;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setMarkdownCopied(true);
      window.setTimeout(() => setMarkdownCopied(false), 2000);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not copy Markdown to clipboard.",
      );
    }
  }

  async function exportPdf() {
    setPdfLoading(true);
    let pdfObjectUrl: string | null = null;
    try {
      const res = await fetch("/api/digest-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          digest,
          displayTheme,
          colorMode: exportColorMode,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      pdfObjectUrl = URL.createObjectURL(blob);
      const filename = `${digestPdfBaseFilename(digest.title)}.pdf`;

      if (openPdfInNewTab(pdfObjectUrl)) {
        window.setTimeout(() => {
          if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
        }, 180_000);
        return;
      }

      setPdfPreview({
        url: pdfObjectUrl,
        title: digest.title,
        filename,
      });
      pdfObjectUrl = null;
    } catch (e) {
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
      window.alert(e instanceof Error ? e.message : "Could not generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function exportWordDoc() {
    setWordLoading(true);
    try {
      const res = await fetch("/api/digest-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          digest,
          displayTheme,
          colorMode: exportColorMode,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const base = digestPdfBaseFilename(digest.title);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.docx`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not export Word document.",
      );
    } finally {
      setWordLoading(false);
    }
  }

  async function handleCopyMarkdown() {
    await copyMarkdown();
    setMenuOpen(false);
  }

  async function handleExportPdf() {
    setMenuOpen(false);
    await exportPdf();
  }

  async function handleExportWordDoc() {
    setMenuOpen(false);
    await exportWordDoc();
  }

  function toggleAlwaysDayMode() {
    const next = !alwaysDayMode;
    setAlwaysDayMode(next);
    writeExportAlwaysDayMode(next);
  }

  const busy = pdfLoading || wordLoading;

  return (
    <>
      <div
        ref={menuRef}
        className={[
          "story-export-actions",
          "story-page-toolbar__menu-wrap",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={
            compact
              ? `story-page-toolbar__icon-btn${menuOpen ? " story-page-toolbar__icon-btn--open" : ""}${busy ? " story-page-toolbar__icon-btn--loading" : ""}`
              : `story-export-actions__btn story-export-actions__trigger${menuOpen ? " story-export-actions__trigger--open" : ""}${busy ? " story-export-actions__trigger--busy" : ""}`
          }
          title="Export story"
          aria-label="Export story"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-busy={busy}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {busy ? (
            <>
              <span className="story-export-actions__spinner" aria-hidden />
              {compact ? null : "Exporting…"}
            </>
          ) : compact ? (
            <ToolbarExportIcon />
          ) : (
            <>
              Export
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
            className="story-page-toolbar__menu story-export-actions__menu"
            role="menu"
            aria-label="Export options"
          >
            <button
              type="button"
              role="menuitem"
              className={`story-page-toolbar__menu-item story-export-actions__menu-item${pdfLoading ? " story-export-actions__menu-item--loading" : ""}`}
              disabled={pdfLoading}
              aria-live="polite"
              onClick={() => void handleExportPdf()}
            >
              {pdfLoading ? (
                <>
                  <span className="story-export-actions__spinner" aria-hidden />
                  Exporting to PDF…
                </>
              ) : (
                "Export to PDF"
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              className={`story-page-toolbar__menu-item story-export-actions__menu-item${wordLoading ? " story-export-actions__menu-item--loading" : ""}`}
              disabled={wordLoading}
              title="Download as Microsoft Word (.docx)"
              aria-live="polite"
              onClick={() => void handleExportWordDoc()}
            >
              {wordLoading ? (
                <>
                  <span className="story-export-actions__spinner" aria-hidden />
                  Exporting to Word…
                </>
              ) : (
                "Export to Word"
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              className="story-page-toolbar__menu-item story-export-actions__menu-item"
              title="Copy the full story as Markdown"
              onClick={() => void handleCopyMarkdown()}
            >
              {markdownCopied ? "Copied!" : "Copy Markdown"}
            </button>

            {showExportDayModeToggle ? (
              <>
                <div
                  className="story-export-actions__menu-divider"
                  role="separator"
                  aria-hidden
                />

                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={alwaysDayMode}
                  className="story-page-toolbar__menu-item story-export-actions__menu-toggle"
                  title="Export PDF and Word in day mode for printing"
                  onClick={toggleAlwaysDayMode}
                >
                  <span
                    className={`story-export-actions__menu-toggle-box${alwaysDayMode ? " story-export-actions__menu-toggle-box--checked" : ""}`}
                    aria-hidden
                  >
                    {alwaysDayMode ? (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.2 5 8.7 9.5 3.8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="story-export-actions__menu-toggle-copy">
                    <span className="story-export-actions__menu-toggle-label">
                      Export in day mode
                    </span>
                    <span className="story-export-actions__menu-toggle-hint">
                      Printer friendly
                    </span>
                  </span>
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {pdfPreview ? (
        <DigestExportPdfOverlay
          url={pdfPreview.url}
          title={pdfPreview.title}
          filename={pdfPreview.filename}
          onClose={closePdfPreview}
        />
      ) : null}
    </>
  );
}
