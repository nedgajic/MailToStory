import { describe, expect, it } from "vitest";
import { isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  it("allows the configured admin email", () => {
    expect(isAdminEmail("nedgajic@gmail.com")).toBe(true);
    expect(isAdminEmail("  NedGajic@Gmail.com ")).toBe(true);
  });

  it("rejects other emails", () => {
    expect(isAdminEmail("other@gmail.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});
