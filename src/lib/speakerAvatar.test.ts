import { describe, expect, it } from "vitest";
import {
  getInitials,
  gravatarAvatarUrl,
  initialsForSpeaker,
  resolveParticipantDisplayName,
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

  it("matches organizational From labels via email local-part", () => {
    const recruiters = [
      { name: "Julia Kurmann", email: "recruiting@wynwd.com" },
    ];
    expect(
      resolveSpeakerToEmail("wynwood tech Recruiting", recruiters),
    ).toBe("recruiting@wynwd.com");
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

describe("getInitials", () => {
  it("uses first and last name initials", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("derives initials from email local part", () => {
    expect(getInitials("ada.lovelace@example.com")).toBe("AL");
  });
});

describe("resolveParticipantDisplayName", () => {
  const people = [
    { name: "Ada Lovelace", email: "ada@example.com" },
    { name: "Craig McDowall", email: "craig@m.example" },
  ];

  it("uses full participant name when speaker is first name only", () => {
    expect(resolveParticipantDisplayName("Craig", people, "craig@m.example")).toBe(
      "Craig McDowall",
    );
  });

  it("uses initials from resolved full name", () => {
    expect(initialsForSpeaker("Craig", people, "craig@m.example")).toBe("CM");
  });
});
