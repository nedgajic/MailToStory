"use client";

import {
  ANNUAL_BILLING_NOTE,
  ANNUAL_SAVE_HINT,
  type BillingInterval,
} from "@/lib/billing/plans";

type PricingBillingToggleProps = {
  annual: boolean;
  onChange: (annual: boolean) => void;
  className?: string;
  noteClassName?: string;
};

export function PricingBillingToggle({
  annual,
  onChange,
  className = "mkt-pricing__billing",
  noteClassName = "mkt-pricing__billing-note",
}: PricingBillingToggleProps) {
  return (
    <div className={className}>
      <div className="mkt-pricing__toggle" role="group" aria-label="Billing cycle">
        <button
          type="button"
          className={
            annual
              ? "mkt-pricing__toggle-btn"
              : "mkt-pricing__toggle-btn mkt-pricing__toggle-btn--active"
          }
          aria-pressed={!annual}
          onClick={() => onChange(false)}
        >
          Monthly
        </button>
        <button
          type="button"
          className={
            annual
              ? "mkt-pricing__toggle-btn mkt-pricing__toggle-btn--active"
              : "mkt-pricing__toggle-btn"
          }
          aria-pressed={annual}
          onClick={() => onChange(true)}
        >
          Yearly
        </button>
      </div>
      <p
        className={[
          noteClassName,
          !annual ? `${noteClassName}--promo` : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {annual ? ANNUAL_BILLING_NOTE : ANNUAL_SAVE_HINT}
      </p>
    </div>
  );
}

export function pricingIntervalFromAnnual(annual: boolean): BillingInterval {
  return annual ? "annual" : "monthly";
}
