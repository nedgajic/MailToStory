import Link from "next/link";
import {
  BRAND_NAME,
  BRAND_COOKIE_PATH,
  BRAND_DATA_REQUEST_PATH,
  BRAND_PRIVACY_PATH,
  BRAND_TERMS_PATH,
} from "@/lib/brand";

export function MarketingFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <span className="home-footer__brand">{BRAND_NAME}</span>
        <nav className="home-footer__links" aria-label="Legal">
          <Link href={BRAND_PRIVACY_PATH}>Privacy Policy</Link>
          <Link href={BRAND_COOKIE_PATH}>Cookie Policy</Link>
          <Link href={BRAND_TERMS_PATH}>Terms of Service</Link>
          <Link href={BRAND_DATA_REQUEST_PATH}>Data Request</Link>
        </nav>
      </div>
    </footer>
  );
}
