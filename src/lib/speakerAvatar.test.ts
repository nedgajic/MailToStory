import { describe, expect, it } from "vitest";
import {
  gravatarAvatarUrl,
  resolveSpeakerToEmail,
} from "@/lib/speakerAvatar";

describe("resolveSpeakerToEmail", () => {
  const people = [
    { name: "Ada Lovelace", email: "ada@example.com" },
    { name: "Craig McDowall", email: "craig@m.example" },
  ];

  it("matches full name", () => {
    expect(resolveSpeakerToEmail("Ada Lovelace", people)).toBe("ada@example.com");
  });

  it("matches first name only", () => {
    expect(resolveSpeakerToEmail("Craig", people)).toBe("craig@m.example");
  });

  it("extracts from angle-bracket form", () => {
    expect(resolveSpeakerToEmail("Bob <bob@x.com>", people)).toBe("bob@x.com");
  });

  it("returns null when unknown", () => {
    expect(resolveSpeakerToEmail("Zora", people)).toBeNull();
  });
});

describe("gravatarAvatarUrl", () => {
  it("is deterministic and lowercases email", () => {
    const a = gravatarAvatarUrl("Test@Example.COM", 64);
    const b = gravatarAvatarUrl("test@example.com", 64);
    expect(a).toBe(b);
    expect(a).toContain("gravatar.com/avatar/");
    expect(a).toContain("d=404");
  });
});
