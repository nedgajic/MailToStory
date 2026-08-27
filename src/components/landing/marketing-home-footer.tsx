import Link from "next/link";
import Image from "next/image";
import {
  BRAND_ICON_PATH,
  BRAND_NAME,
  BRAND_PRIVACY_URL,
  BRAND_TERMS_URL,
} from "@/lib/brand";

export function MarketingHomeFooter({
  privacyUrl = BRAND_PRIVACY_URL,
}: {
  privacyUrl?: string;
}) {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container mkt-footer__grid">
        <div className="mkt-footer__brand">
          <div className="mkt-footer__logo">
            <Image
              src={BRAND_ICON_PATH}
              alt=""
              width={36}
              height={36}
              className="mkt-logo__img mkt-logo__img--footer"
            />
            <span className="mkt-logo__word">{BRAND_NAME}</span>
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
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#how-it-works">How it works</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
            <li>
              <a href="#faq">FAQ</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mkt-footer__heading">Legal</h3>
          <ul className="mkt-footer__links">
            <li>
              <Link href={privacyUrl}>Privacy Policy</Link>
            </li>
            <li>
              <Link href={BRAND_TERMS_URL}>Terms of Service</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mkt-container mkt-footer__bottom">
        <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
      </div>
    </footer>
  );
}
