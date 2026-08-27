"use client";

import { useState } from "react";
import { PLAN_CARDS, type PlanId } from "@/lib/billing/plans";

export function BillingPanel({
  plan,
  canBill,
  seatQuantity,
  seatsUsed,
  cancelAtPeriodEnd,
  stripeReady,
}: {
  plan: PlanId;
  canBill: boolean;
  seatQuantity: number;
  seatsUsed: number;
  cancelAtPeriodEnd: boolean;
  stripeReady: boolean;
}) {
  const [seats, setSeats] = useState(Math.max(seatQuantity, seatsUsed, 1));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="dash-panel" id="billing">
      <div className="dash-panel__head">
        <h2>Subscription</h2>
        <p>Upgrade, change seats, or cancel. Prorations apply immediately on paid plan changes.</p>
      </div>
      {!canBill ? (
        <p className="dash-muted">Only workspace owners and admins can change billing.</p>
      ) : null}
      {error ? <p className="auth-form__error">{error}</p> : null}
      <div className="dash-plans">
        {PLAN_CARDS.map((card) => (
          <article
            key={card.id}
            className={
              card.id === plan
                ? "dash-plan dash-plan--current"
                : "dash-plan"
            }
          >
            <h3>{card.name}</h3>
            <p className="dash-plan__price">
              {card.price}
              {card.id === "team" ? <span> / seat / mo</span> : card.id === "pro" ? <span> / mo</span> : null}
            </p>
            <p>{card.blurb}</p>
            {card.id === "team" && canBill ? (
              <label className="dash-seats">
                Seats
                <input
                  type="number"
                  min={Math.max(1, seatsUsed)}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value) || 1)}
                />
              </label>
            ) : null}
            {canBill && card.id !== "free" && card.id !== plan ? (
              <button
                type="button"
                className="home-cta home-cta--primary"
                disabled={Boolean(busy) || !stripeReady}
                onClick={() =>
                  void post(
                    plan === "free"
                      ? "/api/stripe/checkout"
                      : "/api/stripe/change-plan",
                    { plan: card.id, seats: card.id === "team" ? seats : 1 },
                  )
                }
              >
                {plan === "free" ? `Start ${card.name}` : `Switch to ${card.name}`}
              </button>
            ) : null}
            {canBill && card.id === "team" && plan === "team" ? (
              <button
                type="button"
                className="home-cta"
                disabled={Boolean(busy) || seats === seatQuantity || !stripeReady}
                onClick={() =>
                  void post("/api/stripe/change-plan", { plan: "team", seats })
                }
              >
                Update seats
              </button>
            ) : null}
            {card.id === plan ? <p className="dash-plan__badge">Current plan</p> : null}
          </article>
        ))}
      </div>
      {canBill && plan !== "free" ? (
        <div className="dash-bill-actions">
          <button
            type="button"
            className="home-cta"
            disabled={Boolean(busy) || !stripeReady}
            onClick={() => void post("/api/stripe/portal")}
          >
            Update payment method
          </button>
          {cancelAtPeriodEnd ? (
            <button
              type="button"
              className="home-cta"
              disabled={Boolean(busy)}
              onClick={() => void post("/api/stripe/cancel", { resume: true })}
            >
              Resume subscription
            </button>
          ) : (
            <button
              type="button"
              className="home-cta"
              disabled={Boolean(busy)}
              onClick={() => void post("/api/stripe/cancel", { resume: false })}
            >
              Cancel at period end
            </button>
          )}
        </div>
      ) : null}
      {!stripeReady && canBill ? (
        <p className="dash-muted">
          Stripe keys are not set in this environment, so checkout is paused.
        </p>
      ) : null}
    </section>
  );
}
