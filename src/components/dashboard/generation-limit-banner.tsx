"use client";

import Link from "next/link";

export function GenerationLimitBanner({
  used,
  limit,
  usedLabel,
  limitLabel,
}: {
  used: number;
  limit: number | null;
  usedLabel?: string;
  limitLabel?: string | null;
}) {
  if (limit == null || limit <= 0) return null;

  const ratio = used / limit;
  if (ratio < 0.8) return null;

  const atLimit = used >= limit;
  const usedDisplay = usedLabel ?? String(used);
  const limitDisplay = limitLabel ?? String(limit);

  return (
    <div
      className={`dash-banner ${atLimit ? "dash-banner--held" : "dash-banner--verify"}`}
      role="status"
    >
      <div className="dash-banner__copy">
        <p className="dash-banner__title">
          {atLimit ? "Monthly credit limit reached" : "Approaching your monthly credit limit"}
        </p>
        <p className="dash-banner__text">
          {atLimit
            ? `You have used ${usedDisplay} of ${limitDisplay} credits this month. Forwarded mail is still saved — open Stories to retry after capacity resets or upgrade your plan.`
            : `You have used ${usedDisplay} of ${limitDisplay} credits this month (${Math.round(ratio * 100)}%).`}
        </p>
      </div>
      <Link href="/settings/billing" className="dash-banner__btn">
        {atLimit ? "Upgrade plan" : "View billing"}
      </Link>
    </div>
  );
}
