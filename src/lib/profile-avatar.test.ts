import { describe, expect, it } from "vitest";
import {
  detectImageMime,
} from "@/lib/profile-avatar";
import {
  isCustomAvatarUrl,
  profileAvatarUrl,
} from "@/lib/profile-avatar-shared";

describe("detectImageMime", () => {
  it("detects jpeg, png, and webp", () => {
    expect(detectImageMime(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe(
      "image/jpeg",
    );
    expect(
      detectImageMime(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe("image/png");
    expect(
      detectImageMime(
        Buffer.concat([
          Buffer.from("RIFF", "ascii"),
          Buffer.alloc(4),
          Buffer.from("WEBP", "ascii"),
        ]),
      ),
    ).toBe("image/webp");
  });

  it("rejects unknown bytes", () => {
    expect(detectImageMime(Buffer.from("not an image"))).toBeNull();
  });
});

describe("isCustomAvatarUrl", () => {
  it("recognizes uploaded avatar paths", () => {
    expect(isCustomAvatarUrl("/api/account/avatar?v=1")).toBe(true);
    expect(isCustomAvatarUrl("https://lh3.googleusercontent.com/a/abc")).toBe(
      false,
    );
  });
});

describe("profileAvatarUrl", () => {
  it("includes cache bust param", () => {
    expect(profileAvatarUrl(1_700_000_000_000)).toBe(
      "/api/account/avatar?v=1700000000000",
    );
  });
});
