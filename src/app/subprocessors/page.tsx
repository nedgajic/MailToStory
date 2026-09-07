import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_DPA_PATH,
  BRAND_NAME,
  BRAND_PRIVACY_PATH,
  BRAND_SUBPROCESSORS_URL,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Subprocessors — ${BRAND_NAME}`,
  description: `Third-party subprocessors used by ${BRAND_NAME}.`,
  alternates: { canonical: BRAND_SUBPROCESSORS_URL },
};

export default function SubprocessorsPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Subprocessors" effectiveDate={EFFECTIVE_DATE}>
        <p>
          {BRAND_NAME} uses the following subprocessors to host the service and
          process data on our behalf. This list is updated when we add or replace
          providers.
        </p>

        <table className="home-legal-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Data processed</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hosting provider (VPS)</td>
              <td>Application hosting, database, file storage</td>
              <td>Account data, forwarded mail, generated stories</td>
              <td>EU / EEA (primary production server)</td>
            </tr>
            <tr>
              <td>Postmark (ActiveCampaign)</td>
              <td>Inbound mail webhook and transactional email</td>
              <td>Email addresses, message content, delivery metadata</td>
              <td>United States (with SCCs / DPA as applicable)</td>
            </tr>
            <tr>
              <td>Google (Gemini API)</td>
              <td>On-demand story generation from forwarded threads</td>
              <td>Forwarded message text submitted for summarization</td>
              <td>United States / global Google infrastructure</td>
            </tr>
            <tr>
              <td>Google (OAuth &amp; optional Analytics)</td>
              <td>Optional sign-in; optional analytics if you consent</td>
              <td>Identity profile; aggregate usage if analytics accepted</td>
              <td>United States / global Google infrastructure</td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>Subscription billing and invoices</td>
              <td>Billing contact, payment method tokens, invoice records</td>
              <td>United States / EU (Stripe entity depends on account setup)</td>
            </tr>
          </tbody>
        </table>

        <p>
          For how we use these providers, see our{" "}
          <a href={BRAND_PRIVACY_PATH}>Privacy Policy</a>. Team customers may
          also review our <a href={BRAND_DPA_PATH}>Data Processing Agreement</a>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
