"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MarketingShell } from "@/components/landing/marketing-shell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <MarketingShell>
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">Error</p>
            <h1>Something went wrong</h1>
            <p className="dash-muted">
              A temporary problem stopped this page from loading. Try again, or
              head back to the dashboard.
            </p>
          </header>
          <div className="dash-quick-actions">
            <button type="button" className="home-cta home-cta--primary" onClick={reset}>
              Try again
            </button>
            <Link href="/dashboard" className="home-cta home-cta--secondary">
              Open dashboard
            </Link>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
