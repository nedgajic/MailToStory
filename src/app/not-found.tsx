import Link from "next/link";
import { MarketingShell } from "@/components/landing/marketing-shell";

export default function NotFound() {
  return (
    <MarketingShell>
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">404</p>
            <h1>Page not found</h1>
            <p className="dash-muted">
              That link may be outdated, or the page may have moved.
            </p>
          </header>
          <div className="dash-quick-actions">
            <Link href="/" className="home-cta home-cta--primary">
              Back to home
            </Link>
            <Link href="/dashboard" className="home-cta home-cta--secondary">
              Open dashboard
            </Link>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
