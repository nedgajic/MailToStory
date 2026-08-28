import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { CookieSettingsSection } from "@/components/cookie-consent/cookie-settings-section";
import {
  BRAND_COOKIE_URL,
  BRAND_NAME,
  BRAND_PRIVACY_PATH,
  BRAND_URL,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Cookie Policy — ${BRAND_NAME}`,
  description: `How ${BRAND_NAME} uses cookies and similar technologies.`,
  alternates: { canonical: BRAND_COOKIE_URL },
};

export default function CookiePolicyPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Cookie Policy" effectiveDate={EFFECTIVE_DATE}>
        <p>
          This Cookie Policy explains how {BRAND_NAME} ({BRAND_URL}) uses cookies
          and similar technologies. See also our{" "}
          <a href={BRAND_PRIVACY_PATH}>Privacy Policy</a>.
        </p>

        <h2>What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help the site remember actions and preferences (such as
          staying signed in) for a period of time.
        </p>

        <h2>Local storage (consent preferences)</h2>
        <p>
          We store your cookie consent choices in browser <strong>local storage</strong>,
          not in an HTTP cookie:
        </p>
        <ul>
          <li>
            <strong>mts_cookie_consent_v1</strong> — remembers whether you accepted
            analytics cookies. Stored until you clear site data or change your
            settings.
          </li>
        </ul>

        <h2>Cookies we use</h2>

        <h3>1. Necessary cookies</h3>
        <p>
          These cookies are required for the Service to work. They cannot be
          disabled in our cookie banner because the site needs them for sign-in
          and security.
        </p>
        <ul>
          <li>
            <strong>next-auth.session-token</strong> /{" "}
            <strong>__Secure-next-auth.session-token</strong> — keeps you signed
            in (JWT session). Duration: up to 30 days.
          </li>
          <li>
            <strong>next-auth.csrf-token</strong> /{" "}
            <strong>__Host-next-auth.csrf-token</strong> — protects sign-in forms
            from cross-site request forgery. Session-scoped.
          </li>
        </ul>

        <h3>2. Analytics cookies (optional)</h3>
        <p>
          Only set if you opt in via the cookie banner. We use Google Analytics
          to understand aggregate traffic and improve the product.
        </p>
        <ul>
          <li>
            <strong>_ga</strong>, <strong>_ga_*</strong> — Google Analytics
            identifiers. Duration: up to 2 years.
          </li>
        </ul>
        <p>
          Google Analytics is configured with IP anonymization and without ad
          personalization. You can withdraw consent at any time using the button
          below.
        </p>

        <h3>3. Third-party cookies on redirect</h3>
        <p>
          When you use certain features, your browser may visit a third-party site
          that sets its own cookies:
        </p>
        <ul>
          <li>
            <strong>Google</strong> — when you sign in with Google (identity only).
          </li>
          <li>
            <strong>Stripe</strong> — when you open Checkout or the billing portal
            to manage a subscription.
          </li>
        </ul>
        <p>
          Those providers&apos; cookies are governed by their own policies, not
          this page.
        </p>

        <h2>How to manage cookies</h2>
        <p>
          You can change or withdraw consent for analytics cookies on this site at
          any time. You can also block or delete cookies in your browser settings,
          though that may affect sign-in.
        </p>
        <CookieSettingsSection />
      </LegalDocument>
    </MarketingShell>
  );
}
