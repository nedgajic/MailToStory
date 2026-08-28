import { afterEach, describe, expect, it } from "vitest";
import { adminEmails, isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it("allows the default admin email", () => {
    expect(isAdminEmail("nedgajic@gmail.com")).toBe(true);
    expect(isAdminEmail("  NedGajic@Gmail.com ")).toBe(true);
  });

  it("supports ADMIN_EMAILS env override", () => {
    process.env.ADMIN_EMAILS = "ops@mailtostory.com, admin@example.com";
    expect(adminEmails()).toEqual(["ops@mailtostory.com", "admin@example.com"]);
    expect(isAdminEmail("ops@mailtostory.com")).toBe(true);
    expect(isAdminEmail("nedgajic@gmail.com")).toBe(false);
  });

  it("rejects other emails", () => {
    expect(isAdminEmail("other@gmail.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});
