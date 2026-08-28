"use client";

import Link from "next/link";
import { BRAND_COOKIE_PATH } from "@/lib/brand";

type CookieConsentBannerProps = {
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
  onCustomize: () => void;
  onDismiss: () => void;
  onLearnMore: () => void;
};

export function CookieConsentBanner({
  onAcceptAll,
  onRejectNonEssential,
  onCustomize,
  onDismiss,
  onLearnMore,
}: CookieConsentBannerProps) {
  return (
    <div
      className="cookie-consent-banner"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
        <div className="cookie-consent-banner__inner">
          <div className="cookie-consent-banner__main">
            <div className="cookie-consent-banner__copy">
              <div className="cookie-consent-banner__head">
                <span className="cookie-consent-banner__icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C8.5 2 5.5 4.2 4.3 7.5 2.4 8.1 1 9.9 1 12.2 1 15 3.2 17.2 6 17.2h.3c.8 2.2 2.9 3.8 5.4 3.8 2.2 0 4.1-1.2 5.1-3h.2c2.8 0 5-2.2 5-5 0-2.3-1.4-4.1-3.3-4.7C18.5 4.2 15.5 2 12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="8.5" cy="11.5" r="1" fill="currentColor" />
                    <circle cx="12" cy="9.5" r="1" fill="currentColor" />
                    <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <p className="cookie-consent-banner__kicker">Privacy</p>
                  <h2 className="cookie-consent-banner__title">We use cookies</h2>
                </div>
              </div>
              <p className="cookie-consent-banner__text">
                We use necessary cookies to keep you signed in and optional
                analytics cookies to improve MailToStory. You can accept all,
                reject non-essential cookies, or choose what to allow.{" "}
                <Link
                  href={BRAND_COOKIE_PATH}
                  className="cookie-consent-banner__link"
                  onClick={onLearnMore}
                >
                  Learn more
                </Link>
              </p>
            </div>
            <button
              type="button"
              className="cookie-consent-banner__close"
              aria-label="Close"
              onClick={onDismiss}
            >
              ×
            </button>
          </div>
          <div className="cookie-consent-banner__actions">
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
              onClick={onCustomize}
            >
              Customize
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
