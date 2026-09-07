import { afterEach, describe, expect, it } from "vitest";
import { getGaMeasurementId } from "@/lib/ga-measurement-id";

describe("getGaMeasurementId", () => {
  const originalGa = process.env.GA_MEASUREMENT_ID;
  const originalPublic = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  afterEach(() => {
    if (originalGa === undefined) {
      delete process.env.GA_MEASUREMENT_ID;
    } else {
      process.env.GA_MEASUREMENT_ID = originalGa;
    }
    if (originalPublic === undefined) {
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    } else {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalPublic;
    }
  });

  it("prefers GA_MEASUREMENT_ID over NEXT_PUBLIC_GA_MEASUREMENT_ID", () => {
    process.env.GA_MEASUREMENT_ID = "G-SERVER";
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-PUBLIC";
    expect(getGaMeasurementId()).toBe("G-SERVER");
  });

  it("falls back to NEXT_PUBLIC_GA_MEASUREMENT_ID", () => {
    delete process.env.GA_MEASUREMENT_ID;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-PUBLIC";
    expect(getGaMeasurementId()).toBe("G-PUBLIC");
  });

  it("returns undefined when unset", () => {
    delete process.env.GA_MEASUREMENT_ID;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    expect(getGaMeasurementId()).toBeUndefined();
  });
});
