import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { OfficialLegalEntity } from "@/components/landing/official-legal-entity";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_DPA_URL,
  BRAND_NAME,
  BRAND_PRIVACY_PATH,
  BRAND_SUBPROCESSORS_PATH,
  BRAND_SUPPORT_EMAIL,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Data Processing Agreement — ${BRAND_NAME}`,
  description: `Processor terms for Team customers using ${BRAND_NAME}.`,
  alternates: { canonical: BRAND_DPA_URL },
};

export default function DpaPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Data Processing Agreement" effectiveDate={EFFECTIVE_DATE}>
        <p>
          This Data Processing Agreement (&quot;DPA&quot;) applies when a business
          customer (&quot;Controller&quot;) uses the {BRAND_NAME} Team plan and we
          process personal data contained in forwarded email on the
          Controller&apos;s instructions. Consumer-only use is governed by the{" "}
          <a href={BRAND_PRIVACY_PATH}>Privacy Policy</a>.
        </p>

        <h2>1. Parties</h2>
        <p>
          <strong>Processor:</strong>
        </p>
        <OfficialLegalEntity />

        <h2>2. Subject matter and duration</h2>
        <p>
          Processing relates to operating the Team workspace: storing forwarded
          mail, generating stories, team membership, and related support. Processing
          continues for the subscription term and until data is deleted under the
          Privacy Policy or Controller instructions.
        </p>

        <h2>3. Nature and purpose of processing</h2>
        <ul>
          <li>Receiving and storing email threads forwarded by authorized users</li>
          <li>Generating structured summaries with automated AI tools</li>
          <li>Providing search, export, and collaboration within the workspace</li>
          <li>Sending transactional notifications configured by users</li>
        </ul>

        <h2>4. Types of personal data</h2>
        <p>
          Names, email addresses, message headers and bodies, attachments, billing
          contact details, and usage metadata necessary to operate the service.
        </p>

        <h2>5. Controller obligations</h2>
        <ul>
          <li>Ensure a lawful basis to forward mail into {BRAND_NAME}</li>
          <li>Configure authorized senders and team access appropriately</li>
          <li>Inform end users where required by applicable law</li>
          <li>Use export and deletion tools to honour data-subject requests</li>
        </ul>

        <h2>6. Processor obligations</h2>
        <ul>
          <li>Process data only on documented instructions from the Controller</li>
          <li>Maintain appropriate technical and organizational security measures</li>
          <li>Use subprocessors listed in our{" "}
            <a href={BRAND_SUBPROCESSORS_PATH}>Subprocessors</a> page or notify
            material changes</li>
          <li>Assist with data-subject requests where feasible</li>
          <li>Delete or return data when the workspace is deleted, subject to legal
            retention requirements</li>
        </ul>

        <h2>7. Subprocessors</h2>
        <p>
          Controller authorizes use of the subprocessors on our current list. We
          remain responsible for their performance under Article 28 GDPR.
        </p>

        <h2>8. International transfers</h2>
        <p>
          Where personal data is transferred outside the EEA, we rely on appropriate
          safeguards such as Standard Contractual Clauses offered by relevant
          providers.
        </p>

        <h2>9. Security incidents</h2>
        <p>
          We will notify the Controller without undue delay after becoming aware of
          a personal-data breach affecting the workspace, with information required
          under Article 33 GDPR where applicable.
        </p>

        <h2>10. Audits and contact</h2>
        <p>
          Reasonable information about security measures is available on request.
          To enter into a signed DPA or ask questions, email{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
