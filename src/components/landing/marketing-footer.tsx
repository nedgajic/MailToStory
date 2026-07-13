import Link from "next/link";
import {
  BRAND_DOMAIN,
  BRAND_NAME,
  BRAND_PRIVACY_URL,
  BRAND_TERMS_URL,
} from "@/lib/brand";

export function MarketingFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <span className="home-footer__brand">{BRAND_NAME}</span>
        <nav className="home-footer__links" aria-label="Legal">
          <Link href={BRAND_PRIVACY_URL}>Privacy Policy</Link>
          <Link href={BRAND_TERMS_URL}>Terms of Service</Link>
        </nav>
        <p className="home-footer__copy">
          Readable stories for Gmail threads · {BRAND_DOMAIN} · Not affiliated
          with Google.
        </p>
      </div>
    </footer>
  );
}
