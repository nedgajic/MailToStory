import { describe, expect, it } from "vitest";
import { buildDigestPrompt } from "@/lib/buildDigestPrompt";
import type { AttachmentInfo, ThreadMetadata } from "@/lib/preprocessThread";

describe("buildDigestPrompt", () => {
  it("includes metadata and attachment manifest", () => {
    const meta: ThreadMetadata = {
      subject: "Budget",
      participants: [{ name: "Ada", email: "ada@example.com" }],
      firstDate: "Mon, 1 Jan 2024",
      lastDate: "Tue, 2 Jan 2024",
      messageCount: 3,
    };
    const attachments: AttachmentInfo[] = [
      {
        filename: "file.pdf",
        mimeType: "application/pdf",
        messageIndex: 1,
        attachmentId: "aid",
        messageId: "mid",
      },
    ];
    const prompt = buildDigestPrompt("BODY", attachments, meta);
    expect(prompt).toContain("Budget");
    expect(prompt).toContain("ada@example.com");
    expect(prompt).toContain("file.pdf");
    expect(prompt).toContain("BODY");
  });

  it("includes length-specific rules for concise and elaborate", () => {
    const meta: ThreadMetadata = {
      subject: "Budget",
      participants: [{ name: "Ada", email: "ada@example.com" }],
      firstDate: "Mon, 1 Jan 2024",
      lastDate: "Tue, 2 Jan 2024",
      messageCount: 3,
    };
    const concise = buildDigestPrompt("BODY", [], meta, "concise");
    const elaborate = buildDigestPrompt("BODY", [], meta, "elaborate");
    expect(concise).toContain("STORY LENGTH (Concise)");
    expect(elaborate).toContain("STORY LENGTH (Elaborate)");
    expect(elaborate).toContain("6–8 sentences");
  });
});
