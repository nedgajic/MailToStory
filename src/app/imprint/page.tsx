import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { OfficialLegalEntity } from "@/components/landing/official-legal-entity";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_IMPRINT_URL,
  BRAND_NAME,
  BRAND_PRIVACY_PATH,
  BRAND_TERMS_PATH,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Imprint — ${BRAND_NAME}`,
  description: `Legal imprint and company information for ${BRAND_NAME}.`,
  alternates: { canonical: BRAND_IMPRINT_URL },
};

export default function ImprintPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Imprint" effectiveDate={EFFECTIVE_DATE}>
        <p>
          Information pursuant to applicable disclosure requirements for operators
          of commercial websites and the {BRAND_NAME} service.
        </p>

        <h2>Operator</h2>
        <OfficialLegalEntity showMarketingName />

        <h2>Service</h2>
        <p>
          {BRAND_NAME} is an independent email-to-story tool. It is not affiliated
          with, endorsed by, or sponsored by Google LLC or Gmail.
        </p>

        <h2>Related policies</h2>
        <ul>
          <li>
            <a href={BRAND_PRIVACY_PATH}>Privacy Policy</a>
          </li>
          <li>
            <a href={BRAND_TERMS_PATH}>Terms of Service</a>
          </li>
        </ul>
      </LegalDocument>
    </MarketingShell>
  );
}
