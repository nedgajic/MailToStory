"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  acceptAllCookies,
  getCookieConsent,
  hasGivenCookieConsent,
  rejectNonEssentialCookies,
  setCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";
import { BRAND_COOKIE_PATH } from "@/lib/brand";
import { CookieConsentBanner } from "@/components/cookie-consent/cookie-consent-banner";
import { CookiePreferencesModal } from "@/components/cookie-consent/cookie-preferences-modal";
import { GoogleAnalytics } from "@/components/google-analytics";

type CookieConsentContextValue = {
  consent: CookieConsent;
  hasGivenConsent: boolean;
  openSettings: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  }) => void;
  dismissBanner: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}

export function CookieConsentProvider({
  children,
  gaMeasurementId,
}: {
  children: ReactNode;
  gaMeasurementId?: string;
}) {
  const pathname = usePathname();
  const [consent, setConsentState] = useState<CookieConsent>(() =>
    getCookieConsent(),
  );
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsentState(getCookieConsent());
    setHydrated(true);
  }, []);

  const refreshConsent = useCallback((next: CookieConsent) => {
    setConsentState(next);
    setBannerDismissed(false);
  }, []);

  const acceptAll = useCallback(() => {
    refreshConsent(acceptAllCookies());
    setModalOpen(false);
  }, [refreshConsent]);

  const rejectNonEssential = useCallback(() => {
    refreshConsent(rejectNonEssentialCookies());
    setModalOpen(false);
  }, [refreshConsent]);

  const savePreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean; functional: boolean }) => {
      refreshConsent(setCookieConsent(prefs));
      setModalOpen(false);
    },
    [refreshConsent],
  );

  const openSettings = useCallback(() => {
    setModalOpen(true);
    setBannerDismissed(true);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const hasGivenConsent = hasGivenCookieConsent(consent);
  const isCookiePolicyPage = pathname === BRAND_COOKIE_PATH;
  const showBanner =
    hydrated && !hasGivenConsent && !bannerDismissed && !isCookiePolicyPage;

  const value = useMemo(
    () => ({
      consent,
      hasGivenConsent,
      openSettings,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      dismissBanner,
    }),
    [
      consent,
      hasGivenConsent,
      openSettings,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      dismissBanner,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <GoogleAnalytics
        measurementId={gaMeasurementId}
        analyticsEnabled={consent.analytics}
      />
      {showBanner ? (
        <CookieConsentBanner
          onAcceptAll={acceptAll}
          onRejectNonEssential={rejectNonEssential}
          onCustomize={() => {
            setModalOpen(true);
            setBannerDismissed(true);
          }}
          onDismiss={dismissBanner}
          onLearnMore={dismissBanner}
        />
      ) : null}
      <CookiePreferencesModal
        open={modalOpen}
        consent={consent}
        onClose={() => setModalOpen(false)}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
        onRejectNonEssential={rejectNonEssential}
      />
    </CookieConsentContext.Provider>
  );
}
