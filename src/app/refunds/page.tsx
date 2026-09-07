import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_LEGAL_ENTITY,
  BRAND_NAME,
  BRAND_REFUNDS_URL,
  BRAND_SUPPORT_EMAIL,
  BRAND_TERMS_PATH,
} from "@/lib/brand";

const EFFECTIVE_DATE = "August 28, 2026";

export const metadata: Metadata = {
  title: `Refunds & Withdrawal — ${BRAND_NAME}`,
  description: `Refund and EU withdrawal policy for ${BRAND_NAME} paid plans.`,
  alternates: { canonical: BRAND_REFUNDS_URL },
};

export default function RefundsPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Refunds & Withdrawal" effectiveDate={EFFECTIVE_DATE}>
        <p>
          This policy explains how refunds and statutory withdrawal rights apply
          to paid subscriptions for {BRAND_NAME}, operated by {BRAND_LEGAL_ENTITY}.
        </p>

        <h2>1. Prices and tax</h2>
        <p>
          Subscription prices are shown in USD at checkout. We are not registered
          for VAT (DDV) in Slovenia, so no VAT is added to the listed price. If we
          become VAT-registered in the future, we will update checkout and this
          page.
        </p>

        <h2>2. EU right of withdrawal (14 days)</h2>
        <p>
          If you are a consumer in the European Union, you generally have 14 days
          to withdraw from a distance contract without giving a reason.
        </p>
        <p>
          <strong>Digital service that starts immediately:</strong> {BRAND_NAME}{" "}
          is a digital service. When you subscribe, you can forward mail and we
          begin generating stories right away. By completing checkout, you
          request immediate performance of the service and acknowledge that you
          may lose your withdrawal right once the service has started in full, as
          permitted by applicable consumer law.
        </p>
        <p>
          If you have not started using the paid service (no paid-period story
          generation or team usage), contact us within 14 days and we will cancel
          and refund the charge.
        </p>

        <h2>3. Billing through Stripe</h2>
        <p>
          Payments are processed by Stripe. You can update your card or cancel
          renewal anytime under Settings → Billing or the Stripe customer portal.
          Canceling stops future charges; access continues until the end of the
          current billing period unless your account is deleted.
        </p>

        <h2>4. Failed payments and downgrades</h2>
        <p>
          If a renewal payment fails, we may mark your workspace as past due and
          ask you to update billing details. We do not immediately remove stored
          mail, but generation may pause until payment is resolved or you
          downgrade to Free.
        </p>

        <h2>5. How to request a refund</h2>
        <p>
          Email{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>{" "}
          from your account email with the workspace name and invoice date. We
          review requests individually and respond within a reasonable time.
        </p>

        <h2>6. Account deletion</h2>
        <p>
          Deleting your account cancels an active subscription immediately. See{" "}
          <a href={BRAND_TERMS_PATH}>Terms of Service</a> and Settings → Privacy & data.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
