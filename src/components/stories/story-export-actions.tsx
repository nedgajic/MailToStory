"use client";

import { useCallback, useEffect, useState } from "react";
import type { Digest } from "@/lib/digest-schema";
import { DigestExportPdfOverlay } from "@/components/digest/DigestExportPdfOverlay";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";
import { digestToMarkdown } from "@/lib/digestToMarkdown";
import { openPdfInNewTab } from "@/lib/openPdfInNewTab";

export function StoryExportActions({
  digest,
  className,
}: {
  digest: Digest;
  className?: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    title: string;
    filename: string;
  } | null>(null);

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
        body: JSON.stringify({ digest }),
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
        body: JSON.stringify({ digest }),
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

  return (
    <>
      <nav
        className={["story-export-actions", className].filter(Boolean).join(" ")}
        aria-label="Export story"
        aria-busy={pdfLoading || wordLoading}
      >
        <button
          type="button"
          className="story-export-actions__btn"
          title="Copy the full story as Markdown"
          onClick={() => void copyMarkdown()}
        >
          {markdownCopied ? "Copied!" : "Copy Markdown"}
        </button>
        <button
          type="button"
          className={`story-export-actions__btn${pdfLoading ? " story-export-actions__btn--loading" : ""}`}
          disabled={pdfLoading}
          aria-live="polite"
          onClick={() => void exportPdf()}
        >
          {pdfLoading ? (
            <>
              <span className="story-export-actions__spinner" aria-hidden />
              PDF…
            </>
          ) : (
            "Export PDF"
          )}
        </button>
        <button
          type="button"
          className={`story-export-actions__btn${wordLoading ? " story-export-actions__btn--loading" : ""}`}
          disabled={wordLoading}
          title="Download as Microsoft Word (.docx)"
          aria-live="polite"
          onClick={() => void exportWordDoc()}
        >
          {wordLoading ? (
            <>
              <span className="story-export-actions__spinner" aria-hidden />
              Word…
            </>
          ) : (
            "Export Word"
          )}
        </button>
      </nav>

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
