import { describe, expect, it } from "vitest";
import {
  buildSourceMessagesFromGenerics,
  legacyTurnSourcesFromMessages,
  parseSrcTurnIndex,
  sourceMessageIdsInOrder,
} from "@/lib/thread-source-messages";
import { resolveTurnSourceMessageId } from "@/lib/turnSourceMessage";

describe("thread-source-messages", () => {
  it("builds per-turn source snapshots with synthetic ids", () => {
    const sources = buildSourceMessagesFromGenerics(
      [
        {
          id: "src-1",
          from: "Alice <alice@example.com>",
          date: "2026-01-01",
          subject: "Re: Project",
          text: "First reply body",
        },
        {
          id: "src-2",
          from: "Bob <bob@example.com>",
          date: "2026-01-02",
          subject: "Re: Project",
          text: "Second reply body",
        },
      ],
      { storageMessageIds: ["db-1", "db-2"] },
    );

    expect(sourceMessageIdsInOrder(sources)).toEqual(["src-1", "src-2"]);
    expect(sources[0]?.text).toBe("First reply body");
    expect(sources[1]?.text).toBe("Second reply body");
    expect(sources[0]?.storageMessageId).toBe("db-1");
  });

  it("parses legacy forward blobs into separate turns", () => {
    const blob = `---------- Forwarded message ---------
From: Recruiter <jobs@company.com>
Date: Mon, Jan 6, 2026 at 9:00 AM
Subject: Opportunity

We would love to chat.

On Tue, Jan 7, 2026 at 10:00 AM Jane Doe <jane@example.com> wrote:

Sounds good to me.`;

    const sources = legacyTurnSourcesFromMessages([
      {
        id: "fwd-1",
        subject: "Fwd: Opportunity",
        textBody: blob,
        htmlBody: null,
        fromName: "Ned",
        fromEmail: "ned@example.com",
        date: new Date("2026-01-08T12:00:00Z"),
      },
    ]);

    expect(sources.length).toBeGreaterThanOrEqual(2);
    expect(sources[0]?.text).toMatch(/Sounds good/i);
    expect(sources.at(-1)?.from).toContain("jobs@company.com");
  });

  it("parses src turn index", () => {
    expect(parseSrcTurnIndex("src-3")).toBe(3);
    expect(parseSrcTurnIndex("cmtoh5s1s0005")).toBeNull();
  });
});

describe("resolveTurnSourceMessageId", () => {
  it("returns synthetic src id for legacy stories when digest has message_index", () => {
    const id = resolveTurnSourceMessageId({
      messageIndex: 2,
      messageIdsInOrder: ["real-db-id-only"],
      turnIndex: 1,
    });
    expect(id).toBe("src-2");
  });

  it("uses stored per-turn ids when available", () => {
    const id = resolveTurnSourceMessageId({
      messageIndex: 2,
      messageIdsInOrder: ["src-1", "src-2", "src-3"],
      turnIndex: 1,
    });
    expect(id).toBe("src-2");
  });
});
