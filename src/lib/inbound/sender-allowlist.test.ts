import { describe, expect, it } from "vitest";
import { isSenderInAllowlist } from "@/lib/inbound/sender-allowlist";

describe("isSenderInAllowlist", () => {
  const members = ["alice@example.com", "bob@example.com"];

  it("matches member email case-insensitively", () => {
    expect(isSenderInAllowlist("Alice@Example.com", members)).toBe(true);
  });

  it("rejects unknown senders", () => {
    expect(isSenderInAllowlist("stranger@evil.com", members)).toBe(false);
  });

  it("rejects empty sender", () => {
    expect(isSenderInAllowlist("", members)).toBe(false);
  });
});
