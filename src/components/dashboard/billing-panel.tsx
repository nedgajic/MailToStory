"use client";

import { useState, type ReactNode } from "react";
import { PLAN_CARDS, planLabel, type BillingInterval, type PlanId } from "@/lib/billing/plans";
import type { UpcomingBill } from "@/lib/dashboard-data";
import { BillingInvoicesPanel, type BillingInvoice } from "@/components/dashboard/billing-invoices-panel";
import { PlanPriceBlock } from "@/components/billing/plan-price-block";
import {
  PricingBillingToggle,
  pricingIntervalFromAnnual,
} from "@/components/billing/pricing-billing-toggle";
import "@/app/dashboard-billing.css";

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="dash-billing-card__detail">
      <span className="dash-billing-card__detail-icon">{icon}</span>
      <div className="dash-billing-card__detail-body">
        <span className="dash-billing-card__detail-label">{label}</span>
        <span className="dash-billing-card__detail-value">{value}</span>
      </div>
    </li>
  );
}

function PlanCardsGrid({
  plan,
  canBill,
  seatQuantity,
  seatsUsed,
  stripeReady,
  teamName,
  setTeamName,
  seats,
  setSeats,
  busy,
  annual,
  setAnnual,
  onStartPaidPlan,
  onUpdateTeamSeats,
}: {
  plan: PlanId;
  canBill: boolean;
  seatQuantity: number;
  seatsUsed: number;
  stripeReady: boolean;
  teamName: string;
  setTeamName: (value: string) => void;
  seats: number;
  setSeats: (value: number) => void;
  busy: string | null;
  annual: boolean;
  setAnnual: (annual: boolean) => void;
  onStartPaidPlan: (targetPlan: PlanId, interval: BillingInterval) => void;
  onUpdateTeamSeats: (interval: BillingInterval) => void;
}) {
  const interval = pricingIntervalFromAnnual(annual);

  return (
    <>
      <PricingBillingToggle
        annual={annual}
        onChange={setAnnual}
        className="dash-billing__billing-toggle-wrap"
        noteClassName="dash-billing__billing-note"
      />
      <ul className="dash-billing__grid">
      {PLAN_CARDS.map((card) => {
        const isCurrent = card.id === plan;
        const isPro = card.id === "pro";
        const showUpgrade = canBill && card.id !== "free" && card.id !== plan;
        const showTeamUpdate = canBill && card.id === "team" && plan === "team";

        return (
          <li
            key={card.id}
            className={[
              "dash-billing__card",
              `dash-billing__card--${card.id}`,
              isCurrent ? "dash-billing__card--current" : "",
              isPro && !isCurrent ? "dash-billing__card--highlight" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isCurrent ? (
              <span className="dash-billing__ribbon dash-billing__ribbon--current">
                Current plan
              </span>
            ) : isPro ? (
              <span className="dash-billing__ribbon">Most popular</span>
            ) : null}

            <h3 className="dash-billing__card-name">{card.name}</h3>

            <PlanPriceBlock
              planId={card.id}
              interval={interval}
              amountClassName="dash-billing__card-amount"
              suffixClassName="dash-billing__card-period"
              noteClassName="dash-billing__card-price-note"
              blockClassName="dash-billing__card-price-block"
            />

            <p className="dash-billing__card-blurb">{card.blurb}</p>

            <ul className="dash-billing__features">
              {card.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            {card.id === "team" && canBill ? (
              <>
                <label className="dash-billing__seats">
                  <span className="dash-billing__seats-label">Team name</span>
                  <input
                    type="text"
                    value={teamName}
                    placeholder="Northwind Legal"
                    onChange={(e) => setTeamName(e.target.value)}
                    aria-label="Team name"
                  />
                </label>
                <p className="dash-billing__team-hint">
                  Used for your shared inbox address (e.g. northwind@…).
                </p>
                <label className="dash-billing__seats">
                  <span className="dash-billing__seats-label">Team seats</span>
                  <input
                    type="number"
                    min={Math.max(1, seatsUsed)}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value) || 1)}
                    aria-label="Team seats"
                  />
                </label>
              </>
            ) : null}

            <div className="dash-billing__card-actions">
              {showUpgrade ? (
                <button
                  type="button"
                  className="dash-billing__cta dash-billing__cta--primary"
                  disabled={Boolean(busy) || !stripeReady}
                  onClick={() => onStartPaidPlan(card.id, interval)}
                >
                  {plan === "free" ? `Start ${card.name}` : `Switch to ${card.name}`}
                </button>
              ) : null}

              {showTeamUpdate ? (
                <button
                  type="button"
                  className="dash-billing__cta dash-billing__cta--secondary"
                  disabled={Boolean(busy) || seats === seatQuantity}
                  onClick={() => onUpdateTeamSeats(interval)}
                >
                  Update seats
                </button>
              ) : null}

              {isCurrent && plan === "free" ? (
                <span className="dash-billing__included">Included with your account</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
    </>
  );
}

export function BillingPanel({
  plan,
  canBill,
  seatQuantity,
  seatsUsed,
  cancelAtPeriodEnd,
  stripeReady,
  workspaceName,
  upcoming,
  billingFlash,
  invoices,
}: {
  plan: PlanId;
  canBill: boolean;
  seatQuantity: number;
  seatsUsed: number;
  cancelAtPeriodEnd: boolean;
  stripeReady: boolean;
  workspaceName?: string;
  upcoming: UpcomingBill;
  billingFlash: boolean;
  invoices: BillingInvoice[];
}) {
  const [seats, setSeats] = useState(Math.max(seatQuantity, seatsUsed, 1));
  const [teamName, setTeamName] = useState(
    plan === "team" ? workspaceName?.replace(/'s workspace$/i, "") ?? "" : "",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false);
  const [annual, setAnnual] = useState(false);

  const isPaid = plan !== "free";
  const currentCard = PLAN_CARDS.find((c) => c.id === plan);

  async function post(url: string, body?: unknown) {
    setError(null);
    setBusy(url);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  function startPaidPlan(targetPlan: PlanId, interval: BillingInterval) {
    if (targetPlan === "team" && !teamName.trim()) {
      setError("Enter a team name — it becomes your shared inbox address.");
      return;
    }
    void post(
      plan === "free" ? "/api/stripe/checkout" : "/api/stripe/change-plan",
      {
        plan: targetPlan,
        interval,
        seats: targetPlan === "team" ? seats : 1,
        ...(targetPlan === "team" ? { teamName: teamName.trim() } : {}),
      },
    );
  }

  const detailRows: Array<{ key: string; icon: ReactNode; label: string; value: string }> =
    [];

  if (isPaid && upcoming.dateLabel && upcoming.amountLabel && !upcoming.canceling) {
    detailRows.push({
      key: "renewal",
      label: "Next bill",
      value: `${upcoming.dateLabel} · ${upcoming.amountLabel}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.3 2.7M21 3v6h-6" />
        </svg>
      ),
    });
  } else if (isPaid && upcoming.canceling && upcoming.dateLabel) {
    detailRows.push({
      key: "access",
      label: "Access until",
      value: upcoming.dateLabel,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    });
  } else if (!isPaid) {
    detailRows.push({
      key: "free",
      label: "Billing",
      value: upcoming.label,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
    });
  }

  if (plan === "team") {
    detailRows.push({
      key: "seats",
      label: "Seats",
      value: `${seatsUsed} of ${seatQuantity} in use`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    });
  }

  const planPicker = (
    <PlanCardsGrid
      plan={plan}
      canBill={canBill}
      seatQuantity={seatQuantity}
      seatsUsed={seatsUsed}
      stripeReady={stripeReady}
      teamName={teamName}
      setTeamName={setTeamName}
      seats={seats}
      setSeats={setSeats}
      busy={busy}
      annual={annual}
      setAnnual={setAnnual}
      onStartPaidPlan={startPaidPlan}
      onUpdateTeamSeats={(interval) =>
        void post("/api/stripe/change-plan", { plan: "team", interval, seats })
      }
    />
  );

  return (
    <div className="dash-billing-settings">
      {billingFlash ? (
        <div className="dash-billing-banner dash-billing-banner--success" role="status">
          Billing updated successfully.
        </div>
      ) : null}

      {!stripeReady && canBill ? (
        <div className="dash-billing-banner dash-billing-banner--dev" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            <p className="dash-billing-banner__title">Checkout paused</p>
            <p className="dash-billing-banner__text">
              Stripe keys are not set in this environment. Plan changes will work once
              billing is configured.
            </p>
          </div>
        </div>
      ) : null}

      {!canBill ? (
        <p className="dash-billing__notice">
          Only workspace owners and admins can change billing.
        </p>
      ) : null}

      {error ? (
        <p className="dash-billing-card__error" role="alert">
          {error}
        </p>
      ) : null}

      {!isPaid ? (
        <section className="dash-billing-picker-section dash-billing-picker-section--primary">
          {planPicker}
          <p className="dash-billing__fineprint">
            Paid plan changes apply immediately with prorated charges or credits. You can
            downgrade to Free at any time — your stories stay until you delete them.
          </p>
        </section>
      ) : (
        <>
          <article className={`dash-billing-card dash-billing-card--selected dash-billing-card--${plan}`}>
            <div className="dash-billing-card__top">
              <div className="dash-billing-card__plan-block">
                <p className="dash-billing-card__eyebrow">Current plan</p>
                <h2 className="dash-billing-card__plan">{currentCard?.name ?? planLabel(plan)}</h2>
                <p className="dash-billing-card__lede">{currentCard?.blurb}</p>
              </div>
              <span
                className={
                  cancelAtPeriodEnd
                    ? "dash-billing-badge dash-billing-badge--canceling"
                    : "dash-billing-badge dash-billing-badge--active"
                }
              >
                {cancelAtPeriodEnd ? "Canceling" : "Active"}
              </span>
            </div>

            {detailRows.length > 0 ? (
              <ul className="dash-billing-card__details">
                {detailRows.map((row) => (
                  <DetailRow
                    key={row.key}
                    icon={row.icon}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </ul>
            ) : null}

            {cancelAtPeriodEnd ? (
              <p className="dash-billing-card__warn">
                {upcoming.label}
              </p>
            ) : null}

            {canBill ? (
              <div className="dash-billing-card__actions">
                <button
                  type="button"
                  className="dash-billing__cta dash-billing__cta--primary dash-billing-card__btn"
                  disabled={Boolean(busy) || !stripeReady}
                  onClick={() => void post("/api/stripe/portal")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20M6 15h4" />
                  </svg>
                  <span>{busy === "/api/stripe/portal" ? "Opening…" : "Manage subscription"}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="dash-billing-card__btn-ext" aria-hidden>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                  </svg>
                </button>

                <div className="dash-billing-card__secondary-actions">
                  {cancelAtPeriodEnd ? (
                    <button
                      type="button"
                      className="dash-billing__cta dash-billing__cta--secondary"
                      disabled={Boolean(busy)}
                      onClick={() => void post("/api/stripe/cancel", { resume: true })}
                    >
                      Resume subscription
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dash-billing__cta dash-billing__cta--ghost"
                      disabled={Boolean(busy)}
                      onClick={() => void post("/api/stripe/cancel", { resume: false })}
                    >
                      Cancel at period end
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </article>

          {canBill ? (
            <div className="dash-billing-switch-wrap">
              {!showPlanSwitcher ? (
                <button
                  type="button"
                  className="dash-billing-switch-trigger"
                  onClick={() => setShowPlanSwitcher(true)}
                >
                  Change plan or seats
                </button>
              ) : (
                <section className="dash-billing-picker-section">
                  <div className="dash-billing-picker-section__head">
                    <div>
                      <h2 className="dash-billing-picker-section__title">Change plan</h2>
                      <p className="dash-billing-picker-section__intro">
                        Upgrades apply immediately with prorated billing. Downgrades take
                        effect at the end of your current period.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="dash-billing-switch-trigger dash-billing-switch-trigger--ghost"
                      onClick={() => setShowPlanSwitcher(false)}
                    >
                      Hide
                    </button>
                  </div>
                  {planPicker}
                </section>
              )}
            </div>
          ) : null}
        </>
      )}

      <BillingInvoicesPanel invoices={invoices} stripeReady={stripeReady} />
    </div>
  );
}
