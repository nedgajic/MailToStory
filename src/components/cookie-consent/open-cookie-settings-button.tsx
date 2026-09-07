"use client";

import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";

export function OpenCookieSettingsButton({
  className = "home-cta home-cta--secondary",
}: {
  className?: string;
}) {
  const { openSettings } = useCookieConsent();

  return (
    <button type="button" className={className} onClick={openSettings}>
      Open cookie settings
    </button>
  );
}
