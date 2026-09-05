import { describe, expect, it } from "vitest";
import {
  inboundLocalPartCandidates,
  isValidWorkspaceDisplayName,
  slugifyInboundBase,
  validateInboundLocalPart,
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

describe("validateInboundLocalPart", () => {
  it("accepts valid slugs", () => {
    expect(validateInboundLocalPart("northwind-legal")).toEqual({
      ok: true,
      slug: "northwind-legal",
    });
  });

  it("rejects reserved slugs", () => {
    expect(validateInboundLocalPart("support")).toEqual({
      ok: false,
      code: "RESERVED_INBOX_SLUG",
    });
  });

  it("rejects too-short slugs", () => {
    expect(validateInboundLocalPart("a")).toEqual({
      ok: false,
      code: "INVALID_INBOX_SLUG",
    });
  });

  it("normalizes input", () => {
    expect(validateInboundLocalPart("Northwind Legal")).toEqual({
      ok: true,
      slug: "northwind-legal",
    });
  });
});
