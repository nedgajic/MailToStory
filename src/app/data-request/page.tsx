import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { DataRequestForm } from "@/components/gdpr/data-request-form";
import {
  BRAND_DATA_REQUEST_URL,
  BRAND_NAME,
  BRAND_PRIVACY_PATH,
  BRAND_SUPPORT_EMAIL,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Data Request — ${BRAND_NAME}`,
  description: `Request export or deletion of your personal data from ${BRAND_NAME}.`,
  alternates: { canonical: BRAND_DATA_REQUEST_URL },
};

export default function DataRequestPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Data Request" effectiveDate={EFFECTIVE_DATE}>
        <p>
          Use this form if you do not have (or cannot access) a {BRAND_NAME}{" "}
          account but believe we hold personal data about you — for example from
          a team invite, a forwarding address, or mail held in quarantine.
        </p>
        <p>
          If you have an account, sign in and use{" "}
          <a href="/settings/privacy">Settings → Privacy & data</a> to export or delete
          your data instead.
        </p>
        <DataRequestForm />
        <p>
          Questions? Email{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
          See our <a href={BRAND_PRIVACY_PATH}>Privacy Policy</a> for your GDPR
          rights.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
