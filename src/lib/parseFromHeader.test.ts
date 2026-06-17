import { describe, expect, it } from "vitest";
import { parseFromDisplayName } from "./parseFromHeader";

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
