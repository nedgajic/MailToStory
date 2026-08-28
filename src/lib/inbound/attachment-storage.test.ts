import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { attachmentStorageMode, isR2Configured } from "@/lib/inbound/attachment-storage";

describe("attachment storage mode", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.ATTACHMENT_STORAGE;
  });

  afterEach(() => {
    process.env = original;
  });

  it("defaults to local when R2 is not configured", () => {
    expect(isR2Configured()).toBe(false);
    expect(attachmentStorageMode()).toBe("local");
  });

  it("uses R2 when fully configured and mode is auto", () => {
    process.env.R2_BUCKET = "mailtostory";
    process.env.R2_ENDPOINT = "https://example.r2.cloudflarestorage.com";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    expect(isR2Configured()).toBe(true);
    expect(attachmentStorageMode()).toBe("r2");
  });

  it("forces local when ATTACHMENT_STORAGE=local", () => {
    process.env.R2_BUCKET = "mailtostory";
    process.env.R2_ENDPOINT = "https://example.r2.cloudflarestorage.com";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.ATTACHMENT_STORAGE = "local";
    expect(attachmentStorageMode()).toBe("local");
  });
});
