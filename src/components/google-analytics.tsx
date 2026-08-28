"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { COOKIE_CONSENT_CHANGED_EVENT } from "@/lib/cookie-consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function configureGtag(measurementId: string): void {
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("config", measurementId, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  gtag("consent", "update", { analytics_storage: "granted" });
}

function revokeGtag(): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: "denied" });
}

export function GoogleAnalytics({
  analyticsEnabled,
}: {
  analyticsEnabled: boolean;
}) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const onConsentChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ analytics?: boolean }>).detail;
      if (detail?.analytics) {
        if (window.gtag) {
          window.gtag("consent", "update", { analytics_storage: "granted" });
        }
      } else {
        revokeGtag();
      }
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged);
    };
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !analyticsEnabled || !window.gtag) return;
    window.gtag("consent", "update", { analytics_storage: "granted" });
  }, [analyticsEnabled]);

  if (!GA_MEASUREMENT_ID || !analyticsEnabled) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (!loadedRef.current) {
            configureGtag(GA_MEASUREMENT_ID!);
            loadedRef.current = true;
          }
        }}
      />
    </>
  );
}
