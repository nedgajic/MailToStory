import { describe, expect, it } from "vitest";
import {
  messageToThreadPreview,
  sortThreadMessagesChronologically,
  subjectFromThreadMessages,
} from "./threadMessagePreview";

describe("messageToThreadPreview", () => {
  it("maps a Gmail message to preview fields without stripping quoted content", () => {
    const preview = messageToThreadPreview({
      id: "msg1",
      payload: {
        headers: [
          { name: "From", value: "Ada <ada@example.com>" },
          { name: "Date", value: "Mon, 1 Jan 2024 10:00:00 +0000" },
          { name: "Subject", value: "Hello" },
        ],
        mimeType: "text/plain",
        body: {
          data: Buffer.from("New reply\n\nOn Tue wrote:\n> quoted").toString(
            "base64",
          ),
        },
      },
    });

    expect(preview).toMatchObject({
      messageId: "msg1",
      from: "Ada <ada@example.com>",
      date: "Mon, 1 Jan 2024 10:00:00 +0000",
      body: "New reply\n\nOn Tue wrote:\n> quoted",
      bodyHtml: null,
    });
  });

  it("keeps full html content for preview", () => {
    const preview = messageToThreadPreview({
      id: "msg2",
      payload: {
        headers: [],
        mimeType: "text/html",
        body: {
          data: Buffer.from(
            '<div>Reply</div><blockquote class="gmail_quote">Old</blockquote>',
          ).toString("base64"),
        },
      },
    });

    expect(preview?.bodyHtml).toContain("Reply");
    expect(preview?.bodyHtml).toContain("Old");
    expect(preview?.bodyHtml).toContain("blockquote");
  });

  it("returns a placeholder when payload is missing but id exists", () => {
    expect(messageToThreadPreview({ id: "msg1" })).toEqual({
      messageId: "msg1",
      from: "",
      date: "",
      body: "",
      bodyHtml: null,
    });
  });

  it("returns null when message id is missing", () => {
    expect(messageToThreadPreview({ payload: {} })).toBeNull();
  });
});

describe("sortThreadMessagesChronologically", () => {
  it("orders messages oldest to newest", () => {
    const sorted = sortThreadMessagesChronologically([
      { id: "c", internalDate: "3000" },
      { id: "a", internalDate: "1000" },
      { id: "b", internalDate: "2000" },
    ]);

    expect(sorted.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});

describe("subjectFromThreadMessages", () => {
  it("uses the first non-empty subject in the thread", () => {
    expect(
      subjectFromThreadMessages([
        {
          payload: {
            headers: [{ name: "Subject", value: "Re: Budget" }],
          },
        },
        {
          payload: {
            headers: [{ name: "Subject", value: "Budget" }],
          },
        },
      ]),
    ).toBe("Re: Budget");
  });

  it("falls back when no subject exists", () => {
    expect(subjectFromThreadMessages([{ payload: { headers: [] } }])).toBe(
      "(no subject)",
    );
  });
});
