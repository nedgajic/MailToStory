import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generationLimitDaily,
  generationLimitHourly,
  monthlyGenerationLimit,
  regenerationDebounceMinutes,
  requireVerifiedEmailForGeneration,
} from "@/lib/billing/generation-limits";
import {
  GENERATION_LIMIT_DAILY,
  GENERATION_LIMIT_HOURLY,
  PRO_GENERATION_LIMIT_MONTHLY,
  REGENERATION_DEBOUNCE_MINUTES,
  TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT,
} from "@/lib/billing/plans";

describe("generation-limits config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses defaults when env is unset", () => {
    delete process.env.GENERATION_LIMIT_HOURLY;
    delete process.env.GENERATION_LIMIT_DAILY;
    delete process.env.REGENERATION_DEBOUNCE_MINUTES;
    expect(generationLimitHourly()).toBe(GENERATION_LIMIT_HOURLY);
    expect(generationLimitDaily()).toBe(GENERATION_LIMIT_DAILY);
    expect(regenerationDebounceMinutes()).toBe(REGENERATION_DEBOUNCE_MINUTES);
  });

  it("computes paid monthly limits", () => {
    expect(monthlyGenerationLimit("free", 1)).toBeNull();
    expect(monthlyGenerationLimit("pro", 1)).toBe(PRO_GENERATION_LIMIT_MONTHLY);
    expect(monthlyGenerationLimit("team", 3)).toBe(
      TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT * 3,
    );
  });

  it("requires verified email by default", () => {
    delete process.env.INBOUND_REQUIRE_VERIFIED_EMAIL;
    expect(requireVerifiedEmailForGeneration()).toBe(true);
  });

  it("can disable verified email requirement", () => {
    process.env.INBOUND_REQUIRE_VERIFIED_EMAIL = "false";
    expect(requireVerifiedEmailForGeneration()).toBe(false);
  });
});
