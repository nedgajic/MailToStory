import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_NAME,
  BRAND_PRIVACY_URL,
  BRAND_SUPPORT_EMAIL,
  BRAND_TERMS_URL,
  BRAND_URL,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 27, 2026";

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

        <h2>1. Who we are</h2>
        <p>
          Contact{" "}
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

        <h2>3. Data we access</h2>
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
        </ul>

        <h2>4. How we use data</h2>
        <p>
          To run your account, generate stories you request by forwarding,
          email you verification and invites, and process subscriptions. We do
          not sell data, serve ads from your mail, or train general-purpose
          models on your emails. Story generation uses Google Gemini for
          on-demand summarization of the forwarded thread.
        </p>

        <h2>5. Sharing</h2>
        <p>
          Infrastructure providers that process data for us: hosting/database,
          Postmark (inbound and transactional email), Google Gemini (story
          generation), Stripe (payments). We do not sell your mail.
        </p>

        <h2>6. Retention and deletion</h2>
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
            Exports you already downloaded remain on your devices.
          </li>
        </ul>

        <h2>7. Security</h2>
        <p>
          Production traffic uses HTTPS. Passwords are hashed. Inbound webhooks
          require a shared secret. No method of storage is 100% secure.
        </p>

        <h2>8. Children</h2>
        <p>The Service is not directed at children under 13.</p>

        <h2>9. Changes</h2>
        <p>
          We post updates at this URL with a new effective date. See also{" "}
          <a href={BRAND_TERMS_URL}>Terms of Service</a>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
