import { describe, expect, it } from "vitest";
import { digestToMarkdown } from "@/lib/digestToMarkdown";
import type { Digest } from "@/lib/digest-schema";

const sample: Digest = {
  title: "Budget sync",
  resolution_summary: "We agreed to defer.",
  status: "ongoing",
  narrative: [
    { type: "prose", content: "Team discussed Q3.", speaker: "Ada" },
    {
      type: "attachment_reference",
      filename: "sheet.xlsx",
      context: "Numbers reference",
      speaker: "Bob",
    },
  ],
  timeline: [
    {
      date: "2024-01-02",
      actor: "Ada",
      summary: "Sent first draft.",
      message_index: 1,
    },
  ],
  action_items: [
    { owner: "Bob", action: "Update model", due: "2024-01-15" },
  ],
  participants: [
    { name: "Ada Lovelace", email: "ada@example.com", role: "Lead" },
  ],
};

describe("digestToMarkdown", () => {
  it("includes title, recap, story, timeline, actions, participants", () => {
    const md = digestToMarkdown(sample);
    expect(md).toContain("# Budget sync");
    expect(md).toContain("## Recap");
    expect(md).toContain("defer");
    expect(md).toContain("## Story");
    expect(md).toContain("Ada");
    expect(md).toContain("sheet.xlsx");
    expect(md).toContain("## Timeline");
    expect(md).toContain("first draft");
    expect(md).toContain("[msg 1]");
    expect(md).toContain("## Action items");
    expect(md).toContain("Update model");
    expect(md).toContain("## Participants");
    expect(md).toContain("ada@example.com");
  });

  it("strips inline URLs from prose when attachments bundle, lists URLs after", () => {
    const d: Digest = {
      ...sample,
      narrative: [
        {
          type: "prose",
          content: "Watch https://youtu.be/abc for the demo.",
          speaker: "Ada",
          message_index: 1,
        },
        {
          type: "attachment_reference",
          filename: "notes.pdf",
          context: "Handout",
          message_index: 1,
        },
      ],
    };
    const md = digestToMarkdown(d);
    expect(md).toContain("Watch for the demo.");
    expect(md).toMatch(/\n- https:\/\/youtu\.be\/abc\n/);
    expect(md).not.toMatch(/Watch https:\/\//);
    expect(md).toContain("notes.pdf");
  });
});
