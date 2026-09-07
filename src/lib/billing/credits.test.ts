import { describe, expect, it } from "vitest";
import {
  CREDIT_COST_BY_LENGTH,
  CREDIT_UNIT,
  creditCostForLength,
  creditCostLabel,
  formatCredits,
} from "@/lib/billing/credits-shared";
import {
  hasEnoughCredits,
  monthlyCreditAllowance,
} from "@/lib/billing/credits";

describe("creditCostForLength", () => {
  it("weights concise, normal, and elaborate", () => {
    expect(creditCostForLength("concise")).toBe(5);
    expect(creditCostForLength("normal")).toBe(10);
    expect(creditCostForLength("elaborate")).toBe(15);
  });
});

describe("formatCredits", () => {
  it("formats whole and half credits", () => {
    expect(formatCredits(10)).toBe("1");
    expect(formatCredits(5)).toBe("0.5");
    expect(formatCredits(15)).toBe("1.5");
  });
});

describe("monthlyCreditAllowance", () => {
  it("maps plan limits to credit units", () => {
    expect(monthlyCreditAllowance("free", 1)).toBe(50);
    expect(monthlyCreditAllowance("pro", 1)).toBe(5000);
    expect(monthlyCreditAllowance("team", 3)).toBe(15000);
  });
});

describe("hasEnoughCredits", () => {
  it("blocks when cost exceeds allowance", () => {
    expect(hasEnoughCredits(45, 50, CREDIT_COST_BY_LENGTH.concise)).toBe(true);
    expect(hasEnoughCredits(48, 50, CREDIT_COST_BY_LENGTH.normal)).toBe(false);
    expect(hasEnoughCredits(0, null, 100)).toBe(true);
  });
});

describe("creditCostLabel", () => {
  it("shows human-readable cost", () => {
    expect(creditCostLabel("elaborate")).toBe("1.5 credit");
    expect(creditCostLabel("normal")).toBe("1 credit");
  });
});
