import Link from "next/link";
import { BRAND_LEGAL_ENTITY, BRAND_NAME, HELP_NAV_LINK, LEGAL_NAV_LINKS } from "@/lib/brand";

export function MarketingFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <span className="home-footer__brand">
          {BRAND_LEGAL_ENTITY} · {BRAND_NAME}
        </span>
        <nav className="home-footer__links" aria-label="Legal and help">
          <Link href={HELP_NAV_LINK.path}>{HELP_NAV_LINK.label}</Link>
          {LEGAL_NAV_LINKS.map((link) => (
            <Link key={link.path} href={link.path}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
