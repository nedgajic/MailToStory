import { describe, expect, it } from "vitest";
import {
  quarantineRowToPayload,
  truncateQuarantineHtml,
} from "@/lib/inbound/quarantine-payload";

describe("quarantine-payload", () => {
  it("rebuilds a minimal Postmark payload without attachments", () => {
    const payload = quarantineRowToPayload({
      fromEmail: "alice@example.com",
      fromName: "Alice",
      subject: "Hello",
      textBody: "Body text",
      htmlBody: "<p>Hi</p>",
      toAddresses: "inbox@example.com",
      messageDate: new Date("2026-01-01T00:00:00.000Z"),
      postmarkMessageId: "msg-1",
    });
    expect(payload.From).toContain("alice@example.com");
    expect(payload.TextBody).toBe("Body text");
    expect(payload.Attachments).toEqual([]);
  });

  it("truncates large html bodies", () => {
    const html = "x".repeat(60_000);
    expect(truncateQuarantineHtml(html)?.length).toBe(50_000);
  });
});
