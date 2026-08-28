import { describe, expect, it } from "vitest";
import {
  PRO_PRICE_ANNUAL_USD,
  PRO_PRICE_USD,
  TEAM_PRICE_PER_SEAT_ANNUAL_USD,
  TEAM_PRICE_PER_SEAT_USD,
  annualPerMonthUsd,
  billingAmountUsd,
  monthlyAmountUsd,
  planUnitAmountUsd,
} from "@/lib/billing/plans";

describe("billing intervals", () => {
  it("uses monthly list prices by default", () => {
    expect(planUnitAmountUsd("pro", "monthly")).toBe(PRO_PRICE_USD);
    expect(planUnitAmountUsd("team", "monthly")).toBe(TEAM_PRICE_PER_SEAT_USD);
  });

  it("uses annual list prices for yearly billing", () => {
    expect(planUnitAmountUsd("pro", "annual")).toBe(PRO_PRICE_ANNUAL_USD);
    expect(planUnitAmountUsd("team", "annual")).toBe(TEAM_PRICE_PER_SEAT_ANNUAL_USD);
  });

  it("computes team totals for seats", () => {
    expect(monthlyAmountUsd("team", 3)).toBe(74.97);
    expect(billingAmountUsd("team", "annual", 3)).toBe(749.97);
  });

  it("shows annual per-month equivalent below monthly list", () => {
    expect(annualPerMonthUsd("pro")).toBeCloseTo(149.99 / 12, 2);
    expect(annualPerMonthUsd("pro")).toBeLessThan(PRO_PRICE_USD);
  });
});
