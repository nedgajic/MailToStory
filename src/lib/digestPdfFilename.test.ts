import { describe, expect, it } from "vitest";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";

describe("digestPdfBaseFilename", () => {
  it("slugifies and strips unsafe chars", () => {
    expect(digestPdfBaseFilename("Re: Budget / Q3 (urgent)!")).toBe(
      "Re-Budget-Q3-urgent",
    );
  });

  it("falls back when empty", () => {
    expect(digestPdfBaseFilename("   /\\ ")).toBe("gmail-story");
  });
});
