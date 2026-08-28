import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_COOKIE_PATH,
  BRAND_DATA_REQUEST_PATH,
  BRAND_LEGAL_ADDRESS,
  BRAND_LEGAL_ENTITY,
  BRAND_LEGAL_ENTITY_OFFICIAL,
  BRAND_NAME,
  BRAND_PRIVACY_URL,
  BRAND_REGISTRATION_NUMBER,
  BRAND_SUBPROCESSORS_PATH,
  BRAND_SUPPORT_EMAIL,
  BRAND_TAX_NUMBER,
  BRAND_TERMS_PATH,
  BRAND_URL,
  BRAND_VAT_REGISTERED,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `How ${BRAND_NAME} collects, uses, stores, and deletes account and forwarded email data.`,
  alternates: { canonical: BRAND_PRIVACY_URL },
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
        <p>
          This Privacy Policy describes how {BRAND_NAME} collects, uses, stores,
          and shares information when you use{" "}
          <a href={BRAND_URL}>{BRAND_URL}</a>.
        </p>

        <h2>1. Data controller</h2>
        <p>
          The data controller is <strong>{BRAND_LEGAL_ENTITY_OFFICIAL}</strong>,{" "}
          {BRAND_LEGAL_ADDRESS}. Registration number (matična številka):{" "}
          {BRAND_REGISTRATION_NUMBER}. Tax number (davčna številka):{" "}
          {BRAND_TAX_NUMBER}.
          {BRAND_VAT_REGISTERED
            ? " We are registered for VAT in Slovenia."
            : " We are not registered for VAT in Slovenia (ni zavezanec za DDV)."}
        </p>
        <p>
          {BRAND_LEGAL_ENTITY} operates the {BRAND_NAME} product. For privacy
          questions or to exercise your rights, contact{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
          {BRAND_NAME} is not affiliated with Google LLC.
        </p>

        <h2>2. What the Service does</h2>
        <p>
          You create an account with email and password or optional Google
          sign-in (identity only). We give you a private inbound address. When
          you forward an email thread to that address, we store that copy and
          generate a story, timeline, and action list.
        </p>
        <p>
          We never connect to your inbox. We only see mail you send to us.
        </p>

        <h2>3. Data we collect</h2>
        <ul>
          <li>
            <strong>Account:</strong> name, email, password hash (if you set a
            password), optional Google profile image.
          </li>
          <li>
            <strong>Forwarded mail:</strong> headers, subject, body, and
            attachments you send to your inbound address.
          </li>
          <li>
            <strong>Generated stories:</strong> the structured recap we produce
            from that mail.
          </li>
          <li>
            <strong>Billing:</strong> Stripe customer and invoice records if you
            subscribe. Card details stay with Stripe.
          </li>
          <li>
            <strong>Usage analytics (optional):</strong> aggregate page views
            via Google Analytics, only if you accept analytics cookies. See our{" "}
            <a href={BRAND_COOKIE_PATH}>Cookie Policy</a>.
          </li>
        </ul>

        <h2>4. Legal basis for processing (GDPR)</h2>
        <ul>
          <li>
            <strong>Contract:</strong> creating and running your account,
            generating stories from mail you forward, billing paid plans.
          </li>
          <li>
            <strong>Legitimate interest:</strong> security, abuse prevention,
            rate limiting, and improving reliability of the Service.
          </li>
          <li>
            <strong>Consent:</strong> analytics cookies, optional story-ready
            email notifications, and marketing communications if we add them
            later.
          </li>
        </ul>

        <h2>5. How we use data</h2>
        <p>
          To run your account, generate stories you request by forwarding,
          email you verification and invites, and process subscriptions. We do
          not sell data, serve ads from your mail, or train general-purpose
          models on your emails. Story generation uses Google Gemini for
          on-demand summarization of the forwarded thread.
        </p>

        <h2>6. Processors and international transfers</h2>
        <p>
          We use infrastructure and service providers that may process data
          outside the European Economic Area, including in the United States:
        </p>
        <ul>
          <li>Hosting and database (your VPS provider)</li>
          <li>Postmark (inbound and transactional email)</li>
          <li>Google (optional sign-in, Gemini story generation, optional Analytics)</li>
          <li>Stripe (payments)</li>
        </ul>
        <p>
          Where required, we rely on appropriate safeguards such as Standard
          Contractual Clauses and processor data processing terms offered by
          these providers. See our current{" "}
          <a href={BRAND_SUBPROCESSORS_PATH}>Subprocessors</a> list.
        </p>

        <h2>7. Retention and deletion</h2>
        <ul>
          <li>
            Delete any story in the library (including a month or year at a
            time). That removes the stored mail and attachments for those
            conversations.
          </li>
          <li>
            Delete your account in Settings. We cancel a paid subscription
            immediately, remove workspaces you own, and delete stored mail.
          </li>
          <li>
            Quarantined mail from unknown senders is kept for a limited period
            (default 14 days) then deleted automatically.
          </li>
          <li>
            Exports you already downloaded remain on your devices.
          </li>
        </ul>

        <h2>8. Your rights</h2>
        <p>
          If you are in the European Economic Area or United Kingdom, you have
          the right to:
        </p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Rectify inaccurate data</li>
          <li>Erase your data (&quot;right to be forgotten&quot;)</li>
          <li>Restrict or object to certain processing</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time (for consent-based processing)</li>
          <li>
            Lodge a complaint with your supervisory authority — in Slovenia, the{" "}
            <a
              href="https://www.ip-rs.si/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Information Commissioner (IP)
            </a>
          </li>
        </ul>
        <p>
          <strong>Account holders:</strong> use{" "}
          <a href="/settings/profile">Settings → Profile</a> to export or delete
          your account.
        </p>
        <p>
          <strong>Without an account:</strong> use our{" "}
          <a href={BRAND_DATA_REQUEST_PATH}>Data Request</a> form or email{" "}
          {BRAND_SUPPORT_EMAIL}.
        </p>
        <p>
          You can change analytics cookie preferences anytime via our{" "}
          <a href={BRAND_COOKIE_PATH}>Cookie Policy</a>.
        </p>

        <h2>9. Security</h2>
        <p>
          Production traffic uses HTTPS. Passwords are hashed. Inbound webhooks
          require a shared secret. No method of storage is 100% secure.
        </p>

        <h2>10. Children</h2>
        <p>The Service is not directed at children under 13.</p>

        <h2>11. Changes</h2>
        <p>
          We post updates at this URL with a new effective date. See also{" "}
          <a href={BRAND_TERMS_PATH}>Terms of Service</a> and{" "}
          <a href={BRAND_COOKIE_PATH}>Cookie Policy</a>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
