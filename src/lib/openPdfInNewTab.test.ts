import { afterEach, describe, expect, it, vi } from "vitest";
import { openPdfInNewTab } from "./openPdfInNewTab";

describe("openPdfInNewTab", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when window.open succeeds", () => {
    const open = vi.fn(() => ({ closed: false }));
    vi.stubGlobal("window", { open });

    expect(openPdfInNewTab("blob:test")).toBe(true);
    expect(open).toHaveBeenCalledWith("blob:test", "_blank");
  });

  it("returns false when window.open is blocked", () => {
    vi.stubGlobal("window", { open: vi.fn(() => null) });

    expect(openPdfInNewTab("blob:test")).toBe(false);
  });
});
