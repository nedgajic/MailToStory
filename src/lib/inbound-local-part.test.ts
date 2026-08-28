import { describe, expect, it } from "vitest";
import {
  inboundLocalPartCandidates,
  isValidWorkspaceDisplayName,
  slugifyInboundBase,
} from "@/lib/inbound-local-part";

describe("slugifyInboundBase", () => {
  it("slugifies names", () => {
    expect(slugifyInboundBase("Jane Doe")).toBe("jane-doe");
    expect(slugifyInboundBase("Acme Legal")).toBe("acme-legal");
  });
});

describe("inboundLocalPartCandidates", () => {
  it("prefers first name", () => {
    expect(inboundLocalPartCandidates("Jane Doe")[0]).toBe("jane");
  });

  it("includes team-style slug", () => {
    const candidates = inboundLocalPartCandidates("Northwind Team");
    expect(candidates).toContain("northwind");
  });
});

describe("isValidWorkspaceDisplayName", () => {
  it("accepts reasonable names", () => {
    expect(isValidWorkspaceDisplayName("Northwind")).toBe(true);
    expect(isValidWorkspaceDisplayName("A")).toBe(false);
  });
});
