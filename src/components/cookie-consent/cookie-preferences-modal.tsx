"use client";

import { useEffect, useState } from "react";
import type { CookieConsent } from "@/lib/cookie-consent";

type CookiePreferencesModalProps = {
  open: boolean;
  consent: CookieConsent;
  onClose: () => void;
  onSave: (prefs: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  }) => void;
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
};

export function CookiePreferencesModal({
  open,
  consent,
  onClose,
  onSave,
  onAcceptAll,
  onRejectNonEssential,
}: CookiePreferencesModalProps) {
  const [analytics, setAnalytics] = useState(consent.analytics);

  useEffect(() => {
    if (open) setAnalytics(consent.analytics);
  }, [open, consent.analytics]);

  if (!open) return null;

  return (
    <div
      className="cookie-consent-modal"
      role="dialog"
      aria-labelledby="cookieModalTitle"
      aria-modal="true"
    >
      <button
        type="button"
        className="cookie-consent-modal__backdrop"
        aria-label="Close cookie settings"
        onClick={onClose}
      />
      <div className="cookie-consent-modal__panel">
        <div className="cookie-consent-modal__header">
          <h2 id="cookieModalTitle">Cookie settings</h2>
          <button
            type="button"
            className="cookie-consent-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="cookie-consent-modal__body">
          <p className="cookie-consent-modal__intro">
            Choose which cookies you want to accept. Necessary cookies are always
            active because the site needs them to work.
          </p>

          <div className="cookie-consent-category">
            <label className="cookie-consent-category__label">
              <input type="checkbox" checked disabled readOnly />
              <span>Necessary cookies</span>
            </label>
            <p className="cookie-consent-category__desc">
              Required for sign-in, security, and basic site functionality.
            </p>
          </div>

          <div className="cookie-consent-category">
            <label className="cookie-consent-category__label">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>Analytics cookies</span>
            </label>
            <p className="cookie-consent-category__desc">
              Help us understand how visitors use MailToStory via Google Analytics.
              These cookies are only set if you opt in.
            </p>
          </div>
        </div>
        <div className="cookie-consent-modal__footer">
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-btn--ghost"
            onClick={onRejectNonEssential}
          >
            Reject non-essential
          </button>
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-btn--ghost"
            onClick={() =>
              onSave({
                analytics,
                marketing: false,
                functional: false,
              })
            }
          >
            Save preferences
          </button>
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-btn--primary"
            onClick={onAcceptAll}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
