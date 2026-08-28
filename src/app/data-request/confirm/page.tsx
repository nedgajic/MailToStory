import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { GdprConfirmClient } from "@/components/gdpr/gdpr-confirm-client";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Confirm data request — ${BRAND_NAME}`,
};

export default async function DataRequestConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string }>;
}) {
  const params = await searchParams;

  return (
    <MarketingShell>
      <LegalDocument title="Confirm data request" effectiveDate="August 28, 2026">
        <GdprConfirmClient token={params.token ?? ""} type={params.type ?? ""} />
        <p>
          <Link href="/data-request">Back to data requests</Link>
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
