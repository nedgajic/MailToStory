import { describe, expect, it } from "vitest";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";

describe("digestPdfBaseFilename", () => {
  it("prefixes the story title for friendly export names", () => {
    expect(digestPdfBaseFilename("Q3 Budget Review")).toBe(
      "MailToStory - Q3 Budget Review",
    );
  });

  it("strips unsafe filesystem characters while keeping readable spacing", () => {
    expect(digestPdfBaseFilename("Re: Budget / Q3 (urgent)!")).toBe(
      "MailToStory - Re Budget Q3 (urgent)!",
    );
  });

  it("falls back when the title is empty", () => {
    expect(digestPdfBaseFilename("   /\\ ")).toBe("MailToStory - Story");
  });

  it("normalizes unicode punctuation to ASCII for HTTP headers", () => {
    expect(digestPdfBaseFilename("Q3 Review — Final")).toBe(
      "MailToStory - Q3 Review - Final",
    );
    expect(digestPdfBaseFilename("“Hello” — world…")).toBe(
      "MailToStory - Hello - world...",
    );
  });
});
