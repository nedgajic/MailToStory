"use client";

import Link from "next/link";

export function GenerationLimitBanner({
  used,
  limit,
  usedLabel,
  limitLabel,
  billingPage = false,
  onViewPlans,
}: {
  used: number;
  limit: number | null;
  usedLabel?: string;
  limitLabel?: string | null;
  billingPage?: boolean;
  onViewPlans?: () => void;
}) {
  if (limit == null || limit <= 0) return null;

  const ratio = used / limit;
  if (ratio < 0.8) return null;

  const atLimit = used >= limit;
  const usedDisplay = usedLabel ?? String(used);
  const limitDisplay = limitLabel ?? String(limit);
  const actionLabel = billingPage ? "View plans" : atLimit ? "Upgrade plan" : "View billing";

  const description = billingPage
    ? atLimit
      ? `You have used ${usedDisplay} of ${limitDisplay} credits this month. Forwarded mail is still saved — choose a higher plan below to keep generating stories.`
      : `You have used ${usedDisplay} of ${limitDisplay} credits this month (${Math.round(ratio * 100)}%). Choose a higher plan below if you need more capacity.`
    : atLimit
      ? `You have used ${usedDisplay} of ${limitDisplay} credits this month. Forwarded mail is still saved — open Stories to retry after capacity resets or upgrade your plan.`
      : `You have used ${usedDisplay} of ${limitDisplay} credits this month (${Math.round(ratio * 100)}%).`;

  return (
    <div
      className={`dash-banner ${atLimit ? "dash-banner--held" : "dash-banner--verify"}`}
      role="status"
    >
      <div className="dash-banner__copy">
        <p className="dash-banner__title">
          {atLimit ? "Monthly credit limit reached" : "Approaching your monthly credit limit"}
        </p>
        <p className="dash-banner__text">{description}</p>
      </div>
      {billingPage && onViewPlans ? (
        <button type="button" className="dash-banner__btn" onClick={onViewPlans}>
          {actionLabel}
        </button>
      ) : (
        <Link href="/settings/billing" className="dash-banner__btn">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
