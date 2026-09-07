import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import {
  BRAND_LEGAL_ENTITY,
  BRAND_LOGO_TEXT,
  BRAND_NAME,
  LEGAL_NAV_LINKS,
} from "@/lib/brand";

export function MarketingHomeFooter({
  privacyUrl,
  hashPrefix = "",
  variant = "marketing",
}: {
  privacyUrl?: string;
  /** Use "/" in the logged-in app so product anchors open the homepage sections. */
  hashPrefix?: "" | "/";
  variant?: "marketing" | "app";
}) {
  return (
    <footer
      className={
        variant === "app" ? "mkt-footer mkt-footer--app" : "mkt-footer"
      }
    >
      <div className="mkt-container mkt-footer__grid">
        <div className="mkt-footer__brand">
          <div className="mkt-footer__logo">
            <BrandLogo
              width={36}
              height={36}
              className="mkt-logo__img mkt-logo__img--footer"
            />
            <span className="mkt-logo__word">{BRAND_LOGO_TEXT}</span>
          </div>
          <p>
            Forward email threads to a private address and read structured stories,
            timelines, and action lists.
          </p>
        </div>
        <div>
          <h3 className="mkt-footer__heading">Product</h3>
          <ul className="mkt-footer__links">
            <li>
              <a href={`${hashPrefix}#demo`}>Demo</a>
            </li>
            <li>
              <a href={`${hashPrefix}#how-it-works`}>How it works</a>
            </li>
            <li>
              <a href={`${hashPrefix}#pricing`}>Pricing</a>
            </li>
            <li>
              <a href={`${hashPrefix}#faq`}>FAQ</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mkt-footer__heading">Legal</h3>
          <ul className="mkt-footer__links">
            {LEGAL_NAV_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  href={link.path === "/privacy" && privacyUrl ? privacyUrl : link.path}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mkt-container mkt-footer__bottom">
        <span>
          © {new Date().getFullYear()} {BRAND_LEGAL_ENTITY} · {BRAND_NAME}
        </span>
      </div>
    </footer>
  );
}
