"use client";

import Link from "next/link";

export function GenerationLimitBanner({
  used,
  limit,
}: {
  used: number;
  limit: number | null;
}) {
  if (limit == null || limit <= 0) return null;

  const ratio = used / limit;
  if (ratio < 0.8) return null;

  const atLimit = used >= limit;

  return (
    <div
      className={`dash-banner ${atLimit ? "dash-banner--held" : "dash-banner--verify"}`}
      role="status"
    >
      <div className="dash-banner__copy">
        <p className="dash-banner__title">
          {atLimit ? "Monthly story limit reached" : "Approaching your monthly limit"}
        </p>
        <p className="dash-banner__text">
          {atLimit
            ? `You have used ${used} of ${limit} stories this month. Forwarded mail is still saved — open Stories to retry after capacity resets or upgrade your plan.`
            : `You have used ${used} of ${limit} stories this month (${Math.round(ratio * 100)}%).`}
        </p>
      </div>
      <Link href="/settings/billing" className="dash-banner__btn">
        {atLimit ? "Upgrade plan" : "View billing"}
      </Link>
    </div>
  );
}
