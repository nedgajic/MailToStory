import { describe, expect, it } from "vitest";
import {
  formatThreadCorrespondents,
  parseAddressList,
  parseFromDisplayName,
  parseFromHeader,
} from "./parseFromHeader";

function msg(from: string, to = "", cc = "") {
  const headers = [
    { name: "From", value: from },
    ...(to ? [{ name: "To", value: to }] : []),
    ...(cc ? [{ name: "Cc", value: cc }] : []),
  ];
  return { payload: { headers } };
}

describe("parseFromDisplayName", () => {
  it("returns placeholder for empty", () => {
    expect(parseFromDisplayName("")).toBe("(unknown)");
    expect(parseFromDisplayName("   ")).toBe("(unknown)");
  });

  it("returns bare email", () => {
    expect(parseFromDisplayName("a@b.co")).toBe("a@b.co");
  });

  it("parses angle-addr display name", () => {
    expect(parseFromDisplayName("Jane Doe <jane@example.com>")).toBe(
      "Jane Doe",
    );
    expect(parseFromDisplayName('"Quoted" <q@x.com>')).toBe("Quoted");
  });

  it("falls back to email when name empty", () => {
    expect(parseFromDisplayName("<only@example.com>")).toBe("only@example.com");
  });
});

describe("parseFromHeader", () => {
  it("parses named and bare addresses", () => {
    expect(parseFromHeader("Ada Lovelace <ada@example.com>")).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(parseFromHeader("bob@example.com")).toEqual({
      name: "",
      email: "bob@example.com",
    });
  });
});

describe("parseAddressList", () => {
  it("splits comma-separated recipients", () => {
    expect(
      parseAddressList(
        "Ada Lovelace <ada@example.com>, Bob <bob@example.com>",
      ),
    ).toEqual([
      { name: "Ada Lovelace", email: "ada@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ]);
  });
});

describe("formatThreadCorrespondents", () => {
  const owner = "me@example.com";

  it("shows the other sender when the owner sent the latest message", () => {
    const label = formatThreadCorrespondents(
      [
        msg("Alice <alice@example.com>"),
        msg("Me User <me@example.com>"),
      ],
      owner,
    );
    expect(label).toBe("Alice");
  });

  it("lists every other participant in a group thread", () => {
    const label = formatThreadCorrespondents(
      [
        msg("Alice <alice@example.com>"),
        msg("Bob <bob@example.com>"),
        msg("Me User <me@example.com>"),
      ],
      owner,
    );
    expect(label).toBe("Alice, Bob");
  });

  it("falls back to To recipients for owner-only sent mail", () => {
    const label = formatThreadCorrespondents(
      [msg("Me User <me@example.com>", "Carol <carol@example.com>")],
      owner,
    );
    expect(label).toBe("Carol");
  });

  it("matches owner email case-insensitively", () => {
    const label = formatThreadCorrespondents(
      [
        msg(
          "Me User <me@example.com>",
          "Alice <alice@example.com>, ME@EXAMPLE.COM",
        ),
      ],
      owner,
    );
    expect(label).toBe("Alice");
  });
});
