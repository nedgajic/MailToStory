import {
  ANNUAL_SAVE_LABEL,
  formatUsd,
  planUnitAmountUsd,
  annualPerMonthUsd,
  priceSuffix,
  type BillingInterval,
  type PlanId,
} from "@/lib/billing/plans";

type PlanPriceBlockProps = {
  planId: PlanId;
  interval: BillingInterval;
  amountClassName?: string;
  suffixClassName?: string;
  noteClassName?: string;
  blockClassName?: string;
};

export function PlanPriceBlock({
  planId,
  interval,
  amountClassName = "mkt-pricing__price-amount",
  suffixClassName = "mkt-pricing__price-suffix",
  noteClassName = "mkt-pricing__price-note",
  blockClassName = "mkt-pricing__price-block",
}: PlanPriceBlockProps) {
  if (planId === "free") {
    return (
      <div className={blockClassName}>
        <p className="mkt-pricing__price">
          <span className={amountClassName}>{formatUsd(0, 0)}</span>
        </p>
      </div>
    );
  }

  const suffix = priceSuffix(planId, interval);

  if (interval === "monthly") {
    return (
      <div className={blockClassName}>
        <p className="mkt-pricing__price">
          <span className={amountClassName}>
            {formatUsd(planUnitAmountUsd(planId, "monthly"))}
          </span>
          {suffix ? <span className={suffixClassName}>{suffix}</span> : null}
        </p>
      </div>
    );
  }

  const monthlyList = planUnitAmountUsd(planId, "monthly");
  const annualPerMonth = annualPerMonthUsd(planId);
  const fractionDigits = Number.isInteger(annualPerMonth) ? 0 : 2;

  return (
    <div className={blockClassName}>
      <p className="mkt-pricing__price mkt-pricing__price--annual">
        <span className="mkt-pricing__price-was">{formatUsd(monthlyList)}</span>
        <span className={amountClassName}>
          {formatUsd(annualPerMonth, fractionDigits)}
        </span>
        {suffix ? <span className={suffixClassName}>{suffix}</span> : null}
      </p>
      <p className={noteClassName}>{ANNUAL_SAVE_LABEL}</p>
    </div>
  );
}
