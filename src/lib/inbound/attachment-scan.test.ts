import { describe, expect, it } from "vitest";
import { isBlockedAttachmentType } from "@/lib/inbound/attachment-scan";

describe("isBlockedAttachmentType", () => {
  it("blocks executable extensions", () => {
    expect(isBlockedAttachmentType("invoice.exe", "application/octet-stream")).toContain(".exe");
  });

  it("allows common document types", () => {
    expect(isBlockedAttachmentType("notes.pdf", "application/pdf")).toBeNull();
    expect(isBlockedAttachmentType("photo.jpg", "image/jpeg")).toBeNull();
  });

  it("blocks dangerous MIME types", () => {
    expect(
      isBlockedAttachmentType(
        "payload",
        "application/vnd.microsoft.portable-executable",
      ),
    ).toContain("blocked MIME");
  });
});
