"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const BOOTSTRAP_SCRIPT_ID = "google-analytics-bootstrap";
const LOADER_SCRIPT_ID = "google-analytics-loader";

function pagePath(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function bootstrapSnippet(measurementId: string): string {
  // Queue config before gtag.js loads — consent is granted because GA only
  // mounts after the user accepts analytics cookies.
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('config', '${measurementId}', {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  `;
}

function trackPage(measurementId: string, path: string): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("config", measurementId, {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}

function GoogleAnalyticsTracker({
  measurementId,
  analyticsEnabled,
}: {
  measurementId: string;
  analyticsEnabled: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const readyRef = useRef(false);
  const lastTrackedPathRef = useRef<string | null>(null);
  const currentPath = pagePath(pathname, searchParams);

  useEffect(() => {
    if (!analyticsEnabled || !readyRef.current) return;
    if (lastTrackedPathRef.current === currentPath) return;
    lastTrackedPathRef.current = currentPath;
    trackPage(measurementId, currentPath);
  }, [analyticsEnabled, measurementId, currentPath]);

  if (!analyticsEnabled) return null;

  return (
    <>
      <Script
        id={BOOTSTRAP_SCRIPT_ID}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: bootstrapSnippet(measurementId) }}
      />
      <Script
        id={LOADER_SCRIPT_ID}
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        onLoad={() => {
          readyRef.current = true;
          lastTrackedPathRef.current = currentPath;
        }}
      />
    </>
  );
}

export function GoogleAnalytics({
  measurementId,
  analyticsEnabled,
}: {
  measurementId?: string;
  analyticsEnabled: boolean;
}) {
  if (!measurementId) return null;

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsTracker
        measurementId={measurementId}
        analyticsEnabled={analyticsEnabled}
      />
    </Suspense>
  );
}
