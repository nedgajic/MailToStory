import { describe, expect, it } from "vitest";
import {
  extractUrlsFromText,
  displayUrlLabel,
  stripUrlsFromText,
} from "./extractUrlsFromText";
import { flattenNarrativeForStory } from "./flattenNarrativeForStory";
import type { Digest } from "./digest-schema";

describe("stripUrlsFromText", () => {
  it("removes URLs and tidies spaces", () => {
    expect(
      stripUrlsFromText(
        "See https://a.com/x for details and thanks.",
      ),
    ).toBe("See for details and thanks.");
  });

  it("removes several URLs", () => {
    expect(
      stripUrlsFromText("A https://a.com x www.b.org/y ."),
    ).toBe("A x.");
  });
});

describe("extractUrlsFromText", () => {
  it("finds https URLs and dedupes", () => {
    expect(
      extractUrlsFromText(
        "See https://a.com/x and also https://a.com/x — thanks.",
      ),
    ).toEqual(["https://a.com/x"]);
  });

  it("handles www prefix", () => {
    expect(extractUrlsFromText("Visit www.example.org/path.")).toEqual([
      "https://www.example.org/path",
    ]);
  });
});

describe("displayUrlLabel", () => {
  it("shortens long URLs", () => {
    const long =
      "https://example.com/" + "a".repeat(60);
    expect(displayUrlLabel(long).endsWith("…")).toBe(true);
  });
});

describe("flattenNarrativeForStory", () => {
  it("bundles attachment_reference sharing prose message_index", () => {
    const narrative: Digest["narrative"] = [
      { type: "prose", content: "Hello", message_index: 1 },
      {
        type: "attachment_reference",
        filename: "a.pdf",
        context: "ctx",
        message_index: 1,
      },
      {
        type: "attachment_reference",
        filename: "b.pdf",
        context: "ctx2",
        message_index: 1,
      },
      { type: "prose", content: "Next", message_index: 2 },
    ];
    const flat = flattenNarrativeForStory(narrative);
    expect(flat).toHaveLength(2);
    expect(flat[0]?.kind).toBe("prose_bundle");
    if (flat[0]?.kind === "prose_bundle") {
      expect(flat[0].attachments).toHaveLength(2);
    }
  });

  it("does not bundle when message_index differs", () => {
    const narrative: Digest["narrative"] = [
      { type: "prose", content: "Hello", message_index: 1 },
      {
        type: "attachment_reference",
        filename: "a.pdf",
        context: "ctx",
        message_index: 2,
      },
    ];
    const flat = flattenNarrativeForStory(narrative);
    expect(flat).toHaveLength(2);
    expect(flat[0]?.kind).toBe("prose_bundle");
    if (flat[0]?.kind === "prose_bundle") {
      expect(flat[0].attachments).toHaveLength(0);
    }
    expect(flat[1]?.kind).toBe("attachment_only");
  });
});
