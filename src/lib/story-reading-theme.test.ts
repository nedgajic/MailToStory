import { describe, expect, it } from "vitest";
import {
  STORY_DISPLAY_THEMES,
  parseStoryColorMode,
  parseStoryDisplayTheme,
  resolveExportColorMode,
  storyPageThemeClass,
} from "./story-reading-theme";
import { getDigestExportTheme } from "./digestExportTheme";

describe("story reading themes", () => {
  it("exposes three named displays", () => {
    expect(STORY_DISPLAY_THEMES.map((t) => t.id)).toEqual([
      "dossier",
      "moonletter",
      "wayfarer",
    ]);
  });

  it("maps legacy light storage to moonletter display", () => {
    expect(parseStoryDisplayTheme("light")).toBe("moonletter");
  });

  it("maps legacy light storage to light color mode", () => {
    expect(parseStoryColorMode("light")).toBe("light");
  });

  it("maps unknown or dark storage to dossier + dark", () => {
    expect(parseStoryDisplayTheme("dark")).toBe("dossier");
    expect(parseStoryColorMode("dark")).toBe("dark");
    expect(parseStoryColorMode(null)).toBe("dark");
  });

  it("combines display and color mode classes", () => {
    expect(storyPageThemeClass("wayfarer", "light")).toContain("story-page--wayfarer");
    expect(storyPageThemeClass("wayfarer", "light")).toContain("story-page--light");
    expect(storyPageThemeClass("dossier", "dark")).toContain("story-page--dossier");
    expect(storyPageThemeClass("dossier", "dark")).not.toContain("story-page--light");
  });
});

describe("digest export themes", () => {
  it("returns distinct day-mode palettes per display theme", () => {
    const dossier = getDigestExportTheme("dossier");
    const moonletter = getDigestExportTheme("moonletter");
    const wayfarer = getDigestExportTheme("wayfarer");

    expect(dossier.pageBg).toBe("#ffffff");
    expect(moonletter.pageBg).toBe("#fff8fb");
    expect(wayfarer.pageBg).toBe("#f4ead4");
    expect(moonletter.titleItalic).toBe(true);
    expect(wayfarer.titleUppercase).toBe(true);
    expect(wayfarer.monoFont).toBe("DM Mono");
  });

  it("returns dark palettes when color mode is dark", () => {
    expect(getDigestExportTheme("dossier", "dark").pageBg).toBe("#0e1628");
    expect(getDigestExportTheme("moonletter", "dark").pageBg).toBe("#1a1220");
    expect(getDigestExportTheme("wayfarer", "dark").pageBg).toBe("#1c140c");
  });
});

describe("export color mode resolution", () => {
  it("follows viewer mode unless always-day is enabled", () => {
    expect(resolveExportColorMode("dark", false)).toBe("dark");
    expect(resolveExportColorMode("light", false)).toBe("light");
    expect(resolveExportColorMode("dark", true)).toBe("light");
    expect(resolveExportColorMode("light", true)).toBe("light");
  });
});
