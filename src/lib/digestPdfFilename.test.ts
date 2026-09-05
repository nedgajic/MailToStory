import { describe, expect, it } from "vitest";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";

describe("digestPdfBaseFilename", () => {
  it("prefixes the story title for friendly export names", () => {
    expect(digestPdfBaseFilename("Q3 Budget Review")).toBe(
      "Mail To Story - Q3 Budget Review",
    );
  });

  it("strips unsafe filesystem characters while keeping readable spacing", () => {
    expect(digestPdfBaseFilename("Re: Budget / Q3 (urgent)!")).toBe(
      "Mail To Story - Re Budget Q3 (urgent)!",
    );
  });

  it("falls back when the title is empty", () => {
    expect(digestPdfBaseFilename("   /\\ ")).toBe("Mail To Story - Story");
  });

  it("normalizes unicode punctuation to ASCII for HTTP headers", () => {
    expect(digestPdfBaseFilename("Q3 Review — Final")).toBe(
      "Mail To Story - Q3 Review - Final",
    );
    expect(digestPdfBaseFilename("“Hello” — world…")).toBe(
      "Mail To Story - Hello - world...",
    );
  });
});
