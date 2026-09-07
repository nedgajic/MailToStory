export const CONSENT_STORAGE_KEY = "mts_cookie_consent_v1";
export const CONSENT_VERSION = "1.0";
export const COOKIE_CONSENT_CHANGED_EVENT = "cookieConsentChanged";

export type CookieConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

export type CookieConsent = CookieConsentCategories & {
  timestamp: string | null;
  version: string;
};

const defaultConsent = (): CookieConsent => ({
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
  timestamp: null,
  version: CONSENT_VERSION,
});

export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return defaultConsent();
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return defaultConsent();
    const parsed = JSON.parse(stored) as Partial<CookieConsent>;
    return {
      ...defaultConsent(),
      ...parsed,
      necessary: true,
      version: parsed.version ?? CONSENT_VERSION,
    };
  } catch {
    return defaultConsent();
  }
}

export function hasGivenCookieConsent(consent = getCookieConsent()): boolean {
  return consent.timestamp != null;
}

export function hasCookieConsent(
  category: keyof CookieConsentCategories,
  consent = getCookieConsent(),
): boolean {
  if (category === "necessary") return true;
  return consent[category] === true;
}

export function setCookieConsent(
  preferences: Pick<
    CookieConsentCategories,
    "analytics" | "marketing" | "functional"
  >,
): CookieConsent {
  const consent: CookieConsent = {
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    functional: preferences.functional,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: consent }),
    );
  }
  return consent;
}

export function acceptAllCookies(): CookieConsent {
  return setCookieConsent({
    analytics: true,
    marketing: false,
    functional: false,
  });
}

export function rejectNonEssentialCookies(): CookieConsent {
  return setCookieConsent({
    analytics: false,
    marketing: false,
    functional: false,
  });
}

export function resetCookieConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, {
      detail: defaultConsent(),
    }),
  );
}
