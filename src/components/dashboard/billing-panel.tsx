"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLAN_CARDS, planLabel, type BillingInterval, type PlanId } from "@/lib/billing/plans";
import {
  inboundLocalPartCandidates,
  slugifyInboundBase,
} from "@/lib/inbound-local-part";
import type { UpcomingBill } from "@/lib/dashboard-data";
import { BillingInvoicesPanel, type BillingInvoice } from "@/components/dashboard/billing-invoices-panel";
import { BillingSubscriptionStats } from "@/components/dashboard/billing-subscription-stats";
import { PlanPriceBlock } from "@/components/billing/plan-price-block";
import { SeatChangeForm } from "@/components/team/seat-change-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { ConfirmModal } from "@/components/settings/confirm-modal";
import {
  PricingBillingToggle,
  pricingIntervalFromAnnual,
} from "@/components/billing/pricing-billing-toggle";
import "@/app/dashboard-billing.css";

function defaultInboxSlug(teamName: string): string {
  const candidates = inboundLocalPartCandidates(teamName);
  return candidates[0] ?? slugifyInboundBase(teamName);
}

function PlanCardsGrid({
  plan,
  canBill,
  seatQuantity,
  seatsUsed,
  stripeReady,
  platformAdminBilling = false,
  teamName,
  setTeamName,
  inboxSlug,
  setInboxSlug,
  setInboxSlugTouched,
  inboundDomain,
  seats,
  setSeats,
  busy,
  annual,
  setAnnual,
  onStartPaidPlan,
  onUpdateTeamSeats,
  onDowngradeToFree,
  cancelAtPeriodEnd,
}: {
  plan: PlanId;
  canBill: boolean;
  seatQuantity: number;
  seatsUsed: number;
  stripeReady: boolean;
  platformAdminBilling?: boolean;
  teamName: string;
  setTeamName: (value: string) => void;
  inboxSlug: string;
  setInboxSlug: (value: string) => void;
  setInboxSlugTouched: (value: boolean) => void;
  inboundDomain: string;
  seats: number;
  setSeats: (value: number) => void;
  busy: string | null;
  annual: boolean;
  setAnnual: (annual: boolean) => void;
  onStartPaidPlan: (targetPlan: PlanId, interval: BillingInterval) => void;
  onUpdateTeamSeats: (interval: BillingInterval) => void;
  onDowngradeToFree: () => void;
  cancelAtPeriodEnd: boolean;
}) {
  const interval = pricingIntervalFromAnnual(annual);
  const canChangePlan = stripeReady || platformAdminBilling;
  const showTeamOnboarding = plan !== "team";

  return (
    <>
      <PricingBillingToggle
        annual={annual}
        onChange={setAnnual}
        className="dash-billing__billing-toggle-wrap"
        noteClassName="dash-billing__billing-note"
      />
      <ul className="dash-billing__grid settings-billing__grid">
        {PLAN_CARDS.map((card) => {
          const isCurrent = card.id === plan;
          const isPro = card.id === "pro";
          const showUpgrade = canBill && card.id !== "free" && card.id !== plan;
          const showTeamUpdate = canBill && card.id === "team" && plan === "team";
          const showDowngrade =
            canBill && card.id === "free" && plan !== "free" && canChangePlan;

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
                <div className="auth-form auth-form--settings settings-billing__team-fields">
                  {showTeamOnboarding ? (
                    <>
                      <label className="auth-form__field">
                        Team name
                        <input
                          type="text"
                          value={teamName}
                          placeholder="Northwind Legal"
                          onChange={(e) => setTeamName(e.target.value)}
                          aria-label="Team name"
                        />
                      </label>
                      <label className="auth-form__field">
                        Shared inbox address
                        <div className="settings-inbox-slug">
                          <input
                            type="text"
                            value={inboxSlug}
                            placeholder="northwind"
                            onChange={(e) => {
                              setInboxSlugTouched(true);
                              setInboxSlug(e.target.value);
                            }}
                            aria-label="Shared inbox address"
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <span className="settings-inbox-slug__suffix">@{inboundDomain}</span>
                        </div>
                      </label>
                      <p className="dash-muted settings-billing__team-hint">
                        This address is permanent. You can rename your team later without
                        changing it.
                      </p>
                    </>
                  ) : null}
                  <label className="auth-form__field">
                    Team seats
                    <input
                      type="number"
                      min={Math.max(1, seatsUsed)}
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value) || 1)}
                      aria-label="Team seats"
                    />
                  </label>
                </div>
              ) : null}

              <div className="settings-form__footer settings-billing__card-actions">
                {showUpgrade ? (
                  <button
                    type="button"
                    className="settings-btn settings-btn--primary"
                    disabled={Boolean(busy) || !canChangePlan}
                    onClick={() => onStartPaidPlan(card.id, interval)}
                  >
                    {plan === "free" ? `Start ${card.name}` : `Switch to ${card.name}`}
                  </button>
                ) : null}

                {showTeamUpdate ? (
                  <button
                    type="button"
                    className="settings-btn settings-btn--secondary"
                    disabled={Boolean(busy) || seats === seatQuantity}
                    onClick={() => onUpdateTeamSeats(interval)}
                  >
                    Update seats
                  </button>
                ) : null}

                {showDowngrade ? (
                  cancelAtPeriodEnd ? (
                    <span className="dash-muted">Downgrade scheduled for period end</span>
                  ) : (
                    <button
                      type="button"
                      className="settings-btn settings-btn--secondary"
                      disabled={Boolean(busy)}
                      onClick={onDowngradeToFree}
                    >
                      Downgrade to Free
                    </button>
                  )
                ) : null}

                {isCurrent && plan === "free" ? (
                  <span className="dash-muted">Included with your account</span>
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
  platformAdminBilling = false,
  workspaceName,
  inboundDomain,
  upcoming,
  invoices,
  used,
  limit,
  usedCreditsLabel,
  limitCreditsLabel,
  billingInterval = "monthly",
  teamMembers = [],
  teamInvites = [],
  onRegisterFocusPlans,
}: {
  plan: PlanId;
  canBill: boolean;
  seatQuantity: number;
  seatsUsed: number;
  cancelAtPeriodEnd: boolean;
  stripeReady: boolean;
  platformAdminBilling?: boolean;
  workspaceName?: string;
  inboundDomain: string;
  upcoming: UpcomingBill;
  billingFlash?: boolean;
  invoices: BillingInvoice[];
  used: number;
  limit: number | null;
  usedCreditsLabel?: string;
  limitCreditsLabel?: string | null;
  billingInterval?: BillingInterval;
  teamMembers?: Array<{
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
  teamInvites?: Array<{ id: string; email: string }>;
  onRegisterFocusPlans?: (focus: () => void) => void;
}) {
  const [seats, setSeats] = useState(Math.max(seatQuantity, seatsUsed, 1));
  const [teamName, setTeamName] = useState(
    plan === "team" ? workspaceName?.replace(/'s workspace$/i, "") ?? "" : "",
  );
  const [inboxSlug, setInboxSlug] = useState(() =>
    defaultInboxSlug(
      plan === "team"
        ? workspaceName?.replace(/'s workspace$/i, "") ?? ""
        : workspaceName?.replace(/'s workspace$/i, "") ?? "",
    ),
  );
  const [inboxSlugTouched, setInboxSlugTouched] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false);
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const planSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plan === "team" || inboxSlugTouched) return;
    setInboxSlug(defaultInboxSlug(teamName));
  }, [teamName, plan, inboxSlugTouched]);

  const isPaid = plan !== "free";
  const currentCard = PLAN_CARDS.find((c) => c.id === plan);
  const changePlanLabel = plan === "team" ? "Change plan or seats" : "Change plan";

  function openPlanSwitcher() {
    setShowPlanSwitcher(true);
    requestAnimationFrame(() => {
      planSwitcherRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const focusPlans = useCallback(() => {
    if (isPaid && canBill && !cancelAtPeriodEnd) {
      openPlanSwitcher();
      return;
    }
    document.getElementById("billing-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [canBill, cancelAtPeriodEnd, isPaid]);

  useEffect(() => {
    onRegisterFocusPlans?.(focusPlans);
  }, [focusPlans, onRegisterFocusPlans]);

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
    if (targetPlan === "team" && plan !== "team") {
      if (!teamName.trim()) {
        setError("Enter a team name.");
        return;
      }
      if (!inboxSlug.trim()) {
        setError("Enter a shared inbox address.");
        return;
      }
    }
    if (targetPlan === "pro" && plan === "team" && seatsUsed > 1) {
      setError(
        "Switching to Pro keeps one seat. Open Settings → Team, reduce seats to 1, and choose who to remove first.",
      );
      return;
    }
    void post(
      plan === "free" ? "/api/stripe/checkout" : "/api/stripe/change-plan",
      {
        plan: targetPlan,
        interval,
        seats: targetPlan === "team" ? seats : 1,
        ...(targetPlan === "team" && plan !== "team"
          ? { teamName: teamName.trim(), inboxSlug: inboxSlug.trim() }
          : {}),
      },
    );
  }

  function downgradeToFree() {
    setDowngradeModalOpen(true);
  }

  function confirmDowngradeToFree() {
    setDowngradeModalOpen(false);
    void post("/api/stripe/cancel", { resume: false });
  }

  const downgradeImmediate = platformAdminBilling && !stripeReady;
  const downgradeDescription = downgradeImmediate
    ? "Paid billing ends immediately for this workspace. You will move to the Free plan right away."
    : "Your subscription ends at the close of this billing period and you will not be charged again. You keep your current plan until then.";

  const nextBill =
    isPaid && upcoming.dateLabel && upcoming.amountLabel && !upcoming.canceling
      ? { label: "Next bill", value: `${upcoming.dateLabel} · ${upcoming.amountLabel}` }
      : null;

  const accessUntil =
    isPaid && upcoming.canceling && upcoming.dateLabel
      ? { label: "Access until", value: upcoming.dateLabel }
      : null;

  const planPicker = (
    <PlanCardsGrid
      plan={plan}
      canBill={canBill}
      seatQuantity={seatQuantity}
      seatsUsed={seatsUsed}
      stripeReady={stripeReady}
      platformAdminBilling={platformAdminBilling}
      teamName={teamName}
      setTeamName={setTeamName}
      inboxSlug={inboxSlug}
      setInboxSlug={setInboxSlug}
      setInboxSlugTouched={setInboxSlugTouched}
      inboundDomain={inboundDomain}
      seats={seats}
      setSeats={setSeats}
      busy={busy}
      annual={annual}
      setAnnual={setAnnual}
      onStartPaidPlan={startPaidPlan}
      onUpdateTeamSeats={(interval) =>
        void post("/api/stripe/change-plan", { plan: "team", interval, seats })
      }
      onDowngradeToFree={downgradeToFree}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
    />
  );

  return (
    <>
      {platformAdminBilling && canBill ? (
        <SettingsSection title="Platform admin">
          <p className="dash-muted">
            Plan and seat changes apply instantly here — no Stripe checkout or card
            required.
          </p>
        </SettingsSection>
      ) : !stripeReady && canBill ? (
        <SettingsSection title="Checkout paused">
          <p className="dash-muted">
            Stripe keys are not set in this environment. Plan changes will work once
            billing is configured.
          </p>
        </SettingsSection>
      ) : null}

      {!canBill ? (
        <SettingsSection title="Billing access">
          <p className="dash-muted">
            Only workspace owners and admins can change billing.
          </p>
        </SettingsSection>
      ) : null}

      {error ? <p className="auth-form__error settings-billing__error">{error}</p> : null}

      {!isPaid ? (
        <SettingsSection title="Plans" id="billing-plans">
          {planPicker}
          <p className="dash-muted settings-billing__fineprint">
            Paid plan changes apply immediately with prorated charges or credits. You can
            downgrade to Free at any time — your stories stay until you delete them.
          </p>
        </SettingsSection>
      ) : (
        <>
          <SettingsSection title="Subscription">
            <div className="settings-billing__plan-head">
              <div>
                <p className="dash-muted settings-billing__plan-label">Current plan</p>
                <p className="settings-billing__plan-name">
                  {currentCard?.name ?? planLabel(plan)}
                </p>
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

            {currentCard?.blurb ? (
              <p className="dash-muted">{currentCard.blurb}</p>
            ) : null}

            <BillingSubscriptionStats
              nextBillLabel={nextBill?.label}
              nextBillValue={nextBill?.value}
              accessUntilLabel={accessUntil?.label}
              accessUntilValue={accessUntil?.value}
              creditsUsedLabel={usedCreditsLabel ?? String(used)}
              creditsLimitLabel={limitCreditsLabel ?? String(limit ?? 0)}
              used={used}
              limit={limit}
              seatsUsed={seatsUsed}
              seatQuantity={seatQuantity}
              showSeats={plan === "team"}
            />

            {cancelAtPeriodEnd ? (
              <p className="auth-form__error">{upcoming.label}</p>
            ) : null}

            {canBill ? (
              <div className="settings-form__footer settings-billing__actions">
                {stripeReady ? (
                  <button
                    type="button"
                    className="settings-btn settings-btn--primary"
                    disabled={Boolean(busy)}
                    onClick={() => void post("/api/stripe/portal")}
                  >
                    {busy === "/api/stripe/portal" ? "Opening…" : "Manage subscription"}
                  </button>
                ) : null}

                {cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    className="settings-btn settings-btn--secondary"
                    disabled={Boolean(busy)}
                    onClick={() => void post("/api/stripe/cancel", { resume: true })}
                  >
                    Resume subscription
                  </button>
                ) : (
                  <button
                    type="button"
                    className="settings-btn settings-btn--secondary"
                    disabled={Boolean(busy)}
                    onClick={openPlanSwitcher}
                  >
                    {changePlanLabel}
                  </button>
                )}
              </div>
            ) : null}
          </SettingsSection>

          {canBill && plan === "team" ? (
            <SeatChangeForm
              seatQuantity={seatQuantity}
              seatsUsed={seatsUsed}
              interval={billingInterval}
              stripeReady={stripeReady}
              platformAdminBilling={platformAdminBilling}
              members={teamMembers}
              invites={teamInvites}
            />
          ) : null}

          {canBill && showPlanSwitcher ? (
            <div ref={planSwitcherRef}>
              <SettingsSection title={changePlanLabel}>
                <p className="dash-muted">
                  Switching between Pro and Team applies immediately with prorated charges
                  or credits. If you choose Downgrade to Free, your subscription ends at
                  the close of this billing period and you will not be charged again.
                </p>
                {planPicker}
                <div className="settings-form__footer settings-form__footer--start">
                  <button
                    type="button"
                    className="settings-btn settings-btn--ghost"
                    onClick={() => setShowPlanSwitcher(false)}
                  >
                    Hide plan options
                  </button>
                </div>
              </SettingsSection>
            </div>
          ) : null}
        </>
      )}

      <BillingInvoicesPanel invoices={invoices} stripeReady={stripeReady} />

      <ConfirmModal
        open={downgradeModalOpen}
        title="Downgrade to Free"
        description={downgradeDescription}
        confirmLabel="Downgrade to Free"
        confirmTone="danger"
        busy={busy === "/api/stripe/cancel"}
        onConfirm={confirmDowngradeToFree}
        onCancel={() => setDowngradeModalOpen(false)}
      />
    </>
  );
}
