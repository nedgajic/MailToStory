import { describe, expect, it } from "vitest";
import { formatSkippedAttachmentsNote } from "@/lib/inbound/conversation-lookup";
import { referencedMessageIds } from "@/lib/inbound/threading";

describe("referencedMessageIds", () => {
  it("parses bracketed References headers", () => {
    expect(
      referencedMessageIds({
        Headers: [
          {
            Name: "References",
            Value: "<msg-a@mail.example> <msg-b@mail.example>",
          },
        ],
      }),
    ).toEqual(["msg-a@mail.example", "msg-b@mail.example"]);
  });
});

describe("formatSkippedAttachmentsNote", () => {
  it("summarizes skipped attachment names", () => {
    expect(formatSkippedAttachmentsNote([{ filename: "big.pdf", reason: "size" }])).toContain(
      "big.pdf",
    );
    expect(formatSkippedAttachmentsNote([])).toBeNull();
  });
});
