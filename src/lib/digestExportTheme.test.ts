import { describe, expect, it } from "vitest";
import {
  exportStatusPillBorderRadius,
  getDigestExportTheme,
  pdfBorderRadius,
} from "./digestExportTheme";

describe("digestExportTheme panel shapes", () => {
  it("matches web dossier corner radii", () => {
    const theme = getDigestExportTheme("dossier", "light");
    expect(pdfBorderRadius(theme.panelBorderRadius)).toEqual({ borderRadius: 2 });
    expect(pdfBorderRadius(theme.recapBorderRadius)).toEqual({ borderRadius: 2 });
    expect(theme.recapBorderLeftAccentWidth).toBe(3);
  });

  it("matches web moonletter asymmetric recap and rounded turn panels", () => {
    const theme = getDigestExportTheme("moonletter", "light");
    expect(pdfBorderRadius(theme.panelBorderRadius)).toEqual({ borderRadius: 23 });
    expect(pdfBorderRadius(theme.recapBorderRadius)).toEqual({
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderBottomRightRadius: 26,
      borderBottomLeftRadius: 7,
    });
    expect(exportStatusPillBorderRadius(theme.recapBorderRadius)).toBe(10);
  });

  it("matches web wayfarer dashed recap and square turn panels", () => {
    const theme = getDigestExportTheme("wayfarer", "light");
    expect(pdfBorderRadius(theme.panelBorderRadius)).toEqual({ borderRadius: 2 });
    expect(pdfBorderRadius(theme.recapBorderRadius)).toEqual({ borderRadius: 14 });
    expect(theme.recapBorderStyle).toBe("dashed");
    expect(theme.recapBorderWidth).toBe(2);
  });
});
