function usageTone(percent: number): "low" | "mid" | "high" {
  if (percent >= 95) return "high";
  if (percent >= 80) return "mid";
  return "low";
}

function UsageRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const tone = usageTone(clamped);

  return (
    <div
      className={`settings-billing-usage-ring settings-billing-usage-ring--${tone}`}
      role="img"
      aria-label={`${Math.round(clamped)}% of monthly credits used`}
    >
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <circle
          className="settings-billing-usage-ring__track"
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          strokeWidth="7"
        />
        <circle
          className="settings-billing-usage-ring__fill"
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <span className="settings-billing-usage-ring__value">{Math.round(clamped)}%</span>
    </div>
  );
}

export function BillingSubscriptionStats({
  nextBillLabel,
  nextBillValue,
  accessUntilLabel,
  accessUntilValue,
  creditsUsedLabel,
  creditsLimitLabel,
  used,
  limit,
  seatsUsed,
  seatQuantity,
  showSeats,
}: {
  nextBillLabel?: string;
  nextBillValue?: string;
  accessUntilLabel?: string;
  accessUntilValue?: string;
  creditsUsedLabel: string;
  creditsLimitLabel: string;
  used: number;
  limit: number | null;
  seatsUsed?: number;
  seatQuantity?: number;
  showSeats?: boolean;
}) {
  const creditPercent =
    limit != null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="settings-billing-stats">
      {nextBillLabel && nextBillValue ? (
        <article className="settings-billing-stat settings-billing-stat--bill">
          <p className="settings-billing-stat__eyebrow">{nextBillLabel}</p>
          <p className="settings-billing-stat__value">{nextBillValue}</p>
        </article>
      ) : null}

      {accessUntilLabel && accessUntilValue ? (
        <article className="settings-billing-stat settings-billing-stat--bill">
          <p className="settings-billing-stat__eyebrow">{accessUntilLabel}</p>
          <p className="settings-billing-stat__value">{accessUntilValue}</p>
        </article>
      ) : null}

      {limit != null ? (
        <article className="settings-billing-stat settings-billing-stat--usage">
          <UsageRing percent={creditPercent} />
          <div className="settings-billing-stat__copy">
            <p className="settings-billing-stat__eyebrow">Credits this month</p>
            <p className="settings-billing-stat__value">
              {creditsUsedLabel} <span className="settings-billing-stat__of">of</span>{" "}
              {creditsLimitLabel}
            </p>
            <p className="settings-billing-stat__hint">
              {creditPercent >= 100
                ? "Monthly limit reached"
                : creditPercent >= 80
                  ? "Approaching your monthly limit"
                  : "Story generations this billing month"}
            </p>
          </div>
        </article>
      ) : null}

      {showSeats && seatsUsed != null && seatQuantity != null ? (
        <article className="settings-billing-stat settings-billing-stat--seats">
          <p className="settings-billing-stat__eyebrow">Team seats</p>
          <p className="settings-billing-stat__value">
            {seatsUsed} <span className="settings-billing-stat__of">of</span> {seatQuantity}{" "}
            in use
          </p>
        </article>
      ) : null}
    </div>
  );
}
