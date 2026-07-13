"use client";

import { useEffect } from "react";

type DigestExportPdfOverlayProps = {
  url: string;
  title: string;
  filename: string;
  onClose: () => void;
};

export function DigestExportPdfOverlay({
  url,
  title,
  filename,
  onClose,
}: DigestExportPdfOverlayProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function openInNewTab() {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function download() {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div
      className="digest-export-pdf-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digest-export-pdf-preview-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="digest-export-pdf-preview__card">
        <header className="digest-export-pdf-preview__header">
          <div className="digest-export-pdf-preview__heading">
            <p className="digest-export-pdf-preview__kicker">PDF preview</p>
            <h2
              id="digest-export-pdf-preview-title"
              className="digest-export-pdf-preview__title"
            >
              {title}
            </h2>
            <p className="digest-export-pdf-preview__notice">
              Your browser blocked a new tab, so the PDF is shown here instead.
            </p>
          </div>
          <div className="digest-export-pdf-preview__actions">
            <button
              type="button"
              className="digest-export-pdf-preview__btn digest-export-pdf-preview__btn--secondary"
              onClick={openInNewTab}
            >
              Open in new tab
            </button>
            <button
              type="button"
              className="digest-export-pdf-preview__btn digest-export-pdf-preview__btn--secondary"
              onClick={download}
            >
              Download
            </button>
            <button
              type="button"
              className="digest-export-pdf-preview__btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>
        <iframe
          className="digest-export-pdf-preview__frame"
          title={title}
          src={url}
        />
      </div>
    </div>
  );
}
