"use client";

import type { UserFacingError } from "@/lib/user-facing-error";

type DigestErrorPanelProps = {
  error: UserFacingError;
  onRetry?: () => void;
};

export function DigestErrorPanel({ error, onRetry }: DigestErrorPanelProps) {
  return (
    <div className="digest-error" role="alert">
      <div className="digest-error__icon" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 7.5v5.25M12 15.75h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 className="digest-error__title">{error.title}</h2>
      <p className="digest-error__message">{error.message}</p>

      {error.hint ? <p className="digest-error__hint">{error.hint}</p> : null}

      {error.canRetry && onRetry ? (
        <button type="button" className="digest-error__retry" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
