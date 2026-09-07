import { describe, expect, it } from "vitest";
import { validatePassword } from "@/lib/password";

describe("account password validation", () => {
  it("rejects passwords shorter than 10 characters", () => {
    expect(validatePassword("short")).toMatch(/10/);
  });

  it("accepts valid passwords", () => {
    expect(validatePassword("long-enough-pass")).toBeNull();
  });
});
