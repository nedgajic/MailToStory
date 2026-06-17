import type { gmail_v1 } from "googleapis";
import { describe, expect, it } from "vitest";
import {
  isLikelySignatureOrInlineImage,
  preprocessThread,
  resolveThreadAttachment,
  stripQuotedReplies,
} from "@/lib/preprocessThread";

describe("stripQuotedReplies", () => {
  it("removes Apple Mail style On … wrote: tail", () => {
    const t = [
      "Hi Ned,",
      "",
      "Thanks for your understanding.",
      "",
      "Cheers",
      "Craig",
      "",
      "On 27 Apr 2026, at 8:46 pm, Ned Gajic <ned@gmail.com> wrote:",
      "Hi Craig, this is the quoted part...",
    ].join("\n");
    const out = stripQuotedReplies(t);
    expect(out).toContain("Thanks for your understanding");
    expect(out).not.toContain("Ned Gajic");
    expect(out).not.toContain("quoted part");
  });

  it("removes quote-prefix lines", () => {
    const t = "Hello\n> quoted\nmore";
    expect(stripQuotedReplies(t)).not.toContain("quoted");
  });
});

describe("preprocessThread", () => {
  it("extracts subject and participants", () => {
    const thread: gmail_v1.Schema$Thread = {
      messages: [
        {
          id: "m1",
          payload: {
            headers: [
              { name: "Subject", value: "Re: Project" },
              { name: "From", value: "Ada Lovelace <ada@example.com>" },
              { name: "Date", value: "Mon, 1 Jan 2024 10:00:00 +0000" },
            ],
            body: {
              data: Buffer.from("Starting the thread.\n> old", "utf-8").toString(
                "base64",
              ),
            },
          },
        },
        {
          id: "m2",
          payload: {
            headers: [
              { name: "Subject", value: "Re: Project" },
              { name: "From", value: "Bob <bob@example.com>" },
              { name: "Date", value: "Mon, 1 Jan 2024 11:00:00 +0000" },
            ],
            body: {
              data: Buffer.from("Reply without quotes.", "utf-8").toString(
                "base64",
              ),
            },
          },
        },
      ],
    };

    const result = preprocessThread(thread);
    expect(result.metadata.subject).toBe("Project");
    expect(result.metadata.messageCount).toBe(2);
    expect(result.metadata.participants.length).toBe(2);
    expect(result.cleanedThread).toContain("Ada Lovelace");
    expect(result.cleanedThread).toContain("Bob");
  });

  it("omits inline/signature images from attachment manifest but keeps real files", () => {
    const thread: gmail_v1.Schema$Thread = {
      messages: [
        {
          id: "m1",
          payload: {
            headers: [
              { name: "Subject", value: "Files" },
              { name: "From", value: "Ada <ada@example.com>" },
              { name: "Date", value: "Mon, 1 Jan 2024 10:00:00 +0000" },
            ],
            body: {},
            parts: [
              {
                mimeType: "application/pdf",
                filename: "report.pdf",
                headers: [
                  {
                    name: "Content-Disposition",
                    value: 'attachment; filename="report.pdf"',
                  },
                ],
                body: { attachmentId: "att-pdf" },
              },
              {
                mimeType: "image/png",
                filename: "image001.png",
                headers: [
                  {
                    name: "Content-Disposition",
                    value: 'inline; filename="image001.png"',
                  },
                ],
                body: { attachmentId: "att-sig" },
              },
              {
                mimeType: "image/png",
                filename: "logo.png",
                headers: [{ name: "Content-ID", value: "<abc123>" }],
                body: { attachmentId: "att-cid" },
              },
              {
                mimeType: "image/jpeg",
                filename: "vacation.jpg",
                headers: [
                  {
                    name: "Content-Disposition",
                    value: 'attachment; filename="vacation.jpg"',
                  },
                ],
                body: { attachmentId: "att-real-img" },
              },
            ],
          },
        },
      ],
    };

    const { attachmentManifest } = preprocessThread(thread);
    expect(attachmentManifest.map((a) => a.filename).sort()).toEqual([
      "report.pdf",
      "vacation.jpg",
    ]);
  });
});

describe("resolveThreadAttachment", () => {
  it("matches filename case-insensitively", () => {
    const message: gmail_v1.Schema$Message = {
      id: "m1",
      payload: {
        parts: [
          {
            mimeType: "application/pdf",
            filename: "Report.PDF",
            headers: [
              { name: "Content-Disposition", value: "attachment" },
            ],
            body: { attachmentId: "aid-1", size: 1024 },
          },
        ],
      },
    };
    expect(resolveThreadAttachment(message, "report.pdf")).toEqual({
      attachmentId: "aid-1",
      mimeType: "application/pdf",
      filename: "Report.PDF",
      size: 1024,
    });
  });

  it("returns null for inline signature image", () => {
    const message: gmail_v1.Schema$Message = {
      id: "m1",
      payload: {
        parts: [
          {
            mimeType: "image/png",
            filename: "sig.png",
            headers: [{ name: "Content-Disposition", value: "inline" }],
            body: { attachmentId: "x" },
          },
        ],
      },
    };
    expect(resolveThreadAttachment(message, "sig.png")).toBeNull();
  });
});

describe("isLikelySignatureOrInlineImage", () => {
  it("detects inline disposition", () => {
    expect(
      isLikelySignatureOrInlineImage({
        mimeType: "image/png",
        filename: "x.png",
        headers: [{ name: "Content-Disposition", value: "inline" }],
        body: {},
      }),
    ).toBe(true);
  });

  it("keeps explicit attachment images", () => {
    expect(
      isLikelySignatureOrInlineImage({
        mimeType: "image/png",
        filename: "diagram.png",
        headers: [
          {
            name: "Content-Disposition",
            value: 'attachment; filename="diagram.png"',
          },
        ],
        body: {},
      }),
    ).toBe(false);
  });

  it("detects Content-ID embeds", () => {
    expect(
      isLikelySignatureOrInlineImage({
        mimeType: "image/gif",
        filename: "spacer.gif",
        headers: [{ name: "Content-ID", value: "<cid>" }],
        body: {},
      }),
    ).toBe(true);
  });

  it("ignores non-images", () => {
    expect(
      isLikelySignatureOrInlineImage({
        mimeType: "application/pdf",
        filename: "a.pdf",
        body: {},
      }),
    ).toBe(false);
  });
});
