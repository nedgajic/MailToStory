"use client";

import { useState } from "react";
import { PLAN_CARDS } from "@/lib/billing/plans";
import { PlanPriceBlock } from "@/components/billing/plan-price-block";
import {
  PricingBillingToggle,
  pricingIntervalFromAnnual,
} from "@/components/billing/pricing-billing-toggle";
import { AuthModalTrigger } from "@/components/auth/auth-modal-trigger";

export function PricingCards({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [annual, setAnnual] = useState(false);
  const interval = pricingIntervalFromAnnual(annual);
  const rootClass =
    variant === "dark" ? "mkt-pricing__cards" : "home-plans";
  const cardClass = variant === "dark" ? "mkt-pricing__card" : "home-plan";
  const highlight = variant === "dark" ? " mkt-pricing__card--highlight" : "";

  const amountClass =
    variant === "dark" ? "mkt-pricing__price-amount" : "home-plan__price-amount";
  const suffixClass =
    variant === "dark" ? "mkt-pricing__price-suffix" : "home-plan__price-suffix";
  const noteClass =
    variant === "dark" ? "mkt-pricing__price-note" : "home-plan__price-note";
  const blockClass =
    variant === "dark" ? "mkt-pricing__price-block" : "home-plan__price-block";

  return (
    <div className={variant === "dark" ? "mkt-pricing" : "home-pricing"}>
      <PricingBillingToggle
        annual={annual}
        onChange={setAnnual}
        className={
          variant === "dark" ? "mkt-pricing__billing" : "home-pricing__billing"
        }
        noteClassName={
          variant === "dark"
            ? "mkt-pricing__billing-note"
            : "home-pricing__billing-note"
        }
      />
      <ul className={rootClass}>
        {PLAN_CARDS.map((plan) => {
          const isPro = plan.id === "pro";
          return (
            <li
              key={plan.id}
              className={`${cardClass} ${cardClass}--${plan.id}${isPro && variant === "dark" ? highlight : ""}`}
            >
              {isPro && variant === "dark" ? (
                <span className="mkt-pricing__ribbon">Most popular</span>
              ) : null}
              <h3 className={variant === "dark" ? "mkt-pricing__name" : "home-plan__name"}>
                {plan.name}
              </h3>
              <PlanPriceBlock
                planId={plan.id}
                interval={interval}
                amountClassName={amountClass}
                suffixClassName={suffixClass}
                noteClassName={noteClass}
                blockClassName={blockClass}
              />
              <p className={variant === "dark" ? "mkt-pricing__blurb" : "home-plan__blurb"}>
                {plan.blurb}
              </p>
              <ul
                className={
                  variant === "dark" ? "mkt-pricing__features" : "home-plan__features"
                }
              >
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <AuthModalTrigger
                mode="signup"
                className={
                  variant === "dark"
                    ? "mkt-btn mkt-btn--hero mkt-pricing__cta"
                    : "home-cta home-cta--primary home-plan__cta"
                }
              >
                Get started
              </AuthModalTrigger>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
