import Link from "next/link";
import { PLAN_CARDS, type PlanId } from "@/lib/billing/plans";

function priceSuffix(planId: PlanId): string | null {
  if (planId === "team") return "/ seat / mo";
  if (planId === "pro") return "/ mo";
  return null;
}

export function PricingCards({ variant = "light" }: { variant?: "light" | "dark" }) {
  const rootClass =
    variant === "dark" ? "mkt-pricing__cards" : "home-plans";
  const cardClass = variant === "dark" ? "mkt-pricing__card" : "home-plan";
  const highlight = variant === "dark" ? " mkt-pricing__card--highlight" : "";

  return (
    <ul className={rootClass}>
      {PLAN_CARDS.map((plan) => {
        const suffix = priceSuffix(plan.id);
        const isPro = plan.id === "pro";
        return (
          <li
            key={plan.id}
            className={`${cardClass}${isPro && variant === "dark" ? highlight : ""}`}
          >
            {isPro && variant === "dark" ? (
              <span className="mkt-pricing__ribbon">Most popular</span>
            ) : null}
            <h3 className={variant === "dark" ? "mkt-pricing__name" : "home-plan__name"}>
              {plan.name}
            </h3>
            <p className={variant === "dark" ? "mkt-pricing__price" : "home-plan__price"}>
              <span
                className={
                  variant === "dark"
                    ? "mkt-pricing__price-amount"
                    : "home-plan__price-amount"
                }
              >
                {plan.price}
              </span>
              {suffix ? (
                <span
                  className={
                    variant === "dark"
                      ? "mkt-pricing__price-suffix"
                      : "home-plan__price-suffix"
                  }
                >
                  {suffix}
                </span>
              ) : null}
            </p>
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
            <Link
              href="/signup"
              className={
                variant === "dark"
                  ? "mkt-btn mkt-btn--hero mkt-pricing__cta"
                  : "home-cta home-cta--primary home-plan__cta"
              }
            >
              Get started
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
