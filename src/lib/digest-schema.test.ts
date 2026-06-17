import { describe, expect, it } from "vitest";
import { digestSchema } from "@/lib/digest-schema";

const minimal = {
  title: "T",
  resolution_summary: "R",
  status: "ongoing",
  narrative: [{ type: "prose", content: "Hello" }],
  timeline: [{ date: "2024-01-01", actor: "A", summary: "S" }],
  action_items: [{ owner: null, action: "Do", due: null }],
  participants: [{ name: "N", email: "e@e.com", role: "R" }],
};

describe("digestSchema", () => {
  it("accepts valid digest", () => {
    const r = digestSchema.safeParse(minimal);
    expect(r.success).toBe(true);
  });

  it("rejects bad status", () => {
    const r = digestSchema.safeParse({ ...minimal, status: "nope" });
    expect(r.success).toBe(false);
  });

  it("accepts timeline message_index and narrative speaker", () => {
    const r = digestSchema.safeParse({
      ...minimal,
      narrative: [
        { type: "prose", content: "Hi", speaker: "Ada", message_index: 1 },
        {
          type: "attachment_reference",
          filename: "f.pdf",
          context: "c",
          speaker: "Bob",
          message_index: 2,
        },
      ],
      timeline: [
        {
          date: "2024-01-01",
          actor: "A",
          summary: "S",
          message_index: 2,
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects narrative with missing discriminator", () => {
    const r = digestSchema.safeParse({
      ...minimal,
      narrative: [{ content: "x" }],
    });
    expect(r.success).toBe(false);
  });
});
