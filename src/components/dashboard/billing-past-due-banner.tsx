"use client";

import Link from "next/link";

export function BillingPastDueBanner({ canBill }: { canBill: boolean }) {
  return (
    <div className="dash-banner dash-banner--held" role="alert">
      <div className="dash-banner__copy">
        <p className="dash-banner__title">Payment failed</p>
        <p className="dash-banner__text">
          {canBill
            ? "Your last subscription payment did not go through. Update your payment method to keep Pro or Team access."
            : "Your workspace subscription payment failed. Ask an owner or admin to update billing."}
        </p>
      </div>
      {canBill ? (
        <Link href="/settings/billing" className="dash-banner__btn">
          Fix billing
        </Link>
      ) : null}
    </div>
  );
}
