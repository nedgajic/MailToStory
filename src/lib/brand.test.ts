import { describe, expect, it } from "vitest";
import {
  BRAND_LEGAL_ADDRESS,
  BRAND_LEGAL_ENTITY,
  BRAND_LEGAL_ENTITY_OFFICIAL,
  BRAND_REGISTRATION_NUMBER,
  BRAND_SUPPORT_EMAIL,
  BRAND_TAX_NUMBER,
  BRAND_VAT_REGISTERED,
  LEGAL_NAV_LINKS,
} from "@/lib/brand";

describe("brand legal constants", () => {
  it("uses AJPES company details", () => {
    expect(BRAND_LEGAL_ENTITY).toBe("NEDix s.p.");
    expect(BRAND_LEGAL_ENTITY_OFFICIAL).toContain("Nedeljko Gajić");
    expect(BRAND_LEGAL_ADDRESS).toContain("Kobarid");
    expect(BRAND_REGISTRATION_NUMBER).toBe("7373414000");
    expect(BRAND_TAX_NUMBER).toBe("15526399");
    expect(BRAND_VAT_REGISTERED).toBe(false);
  });

  it("uses the public support address", () => {
    expect(BRAND_SUPPORT_EMAIL).toBe("support@mailtostory.com");
  });

  it("lists core legal pages", () => {
    const paths = LEGAL_NAV_LINKS.map((link) => link.path);
    expect(paths).toContain("/imprint");
    expect(paths).toContain("/refunds");
    expect(paths).toContain("/subprocessors");
    expect(paths).toContain("/dpa");
  });
});
