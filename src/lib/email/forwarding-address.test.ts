import { describe, expect, it } from "vitest";
import { forwardingTokenIdentifier } from "@/lib/email/forwarding-address";

describe("forwardingTokenIdentifier", () => {
  it("normalizes email in token identifier", () => {
    expect(forwardingTokenIdentifier("ws1", "Alice@Example.com")).toBe(
      "forward:ws1:alice@example.com",
    );
  });
});
