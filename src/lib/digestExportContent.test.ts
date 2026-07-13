import { describe, expect, it } from "vitest";
import type { Digest } from "@/lib/digest-schema";
import {
  formatActionItem,
  formatStoryMeta,
  proseBlocksForExport,
  proseExportParts,
} from "./digestExportContent";

const sample: Digest = {
  title: "Budget sync",
  resolution_summary: "We agreed to defer.",
  status: "ongoing",
  narrative: [
    {
      type: "prose",
      content: "See https://example.com/a for details.",
      speaker: "Ada",
      message_index: 1,
    },
    {
      type: "attachment_reference",
      filename: "sheet.xlsx",
      context: "Numbers reference",
      speaker: "Bob",
      message_index: 1,
    },
    { type: "prose", content: "Follow-up sent.", speaker: "Bob" },
  ],
  timeline: [],
  action_items: [{ owner: "Bob", action: "Update model", due: "2024-01-15" }],
  participants: [],
};

describe("digestExportContent", () => {
  it("keeps prose blocks only for export", () => {
    const prose = proseBlocksForExport(sample.narrative);
    expect(prose).toHaveLength(2);
    expect(prose.every((block) => block.type === "prose")).toBe(true);
    expect(prose.some((block) => "filename" in block)).toBe(false);
  });

  it("lists URLs separately without attachment bundling", () => {
    const prose = proseBlocksForExport(sample.narrative)[0];
    expect(prose).toBeDefined();
    const { body, urls } = proseExportParts(prose!.content);
    expect(body).toBe("See for details.");
    expect(urls).toEqual(["https://example.com/a"]);
  });

  it("formats action items like the PDF export", () => {
    expect(formatActionItem(sample.action_items[0]!)).toBe(
      "Update model (Bob) — due 2024-01-15",
    );
  });

  it("formats story meta with participant and date range", () => {
    const digest: Digest = {
      ...sample,
      timeline: [
        {
          date: "2024-01-02",
          actor: "Ada",
          summary: "Kickoff",
          message_index: 1,
        },
        {
          date: "2024-01-15",
          actor: "Bob",
          summary: "Follow-up",
          message_index: 2,
        },
      ],
      participants: [{ name: "Ada", email: "ada@example.com", role: "Lead" }],
    };
    expect(formatStoryMeta(digest)).toBe(
      "1 participants · 2 timeline beats · Jan 2 – Jan 15",
    );
  });
});
