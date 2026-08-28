import { describe, expect, it } from "vitest";
import {
  removableMembers,
  seatsToRemove,
  suggestMemberIdsToRemove,
  validateSeatChange,
} from "@/lib/billing/seats";

const members = [
  { id: "owner", userId: "u1", role: "owner", createdAt: new Date("2026-01-01") },
  { id: "admin", userId: "u2", role: "admin", createdAt: new Date("2026-02-01") },
  { id: "m1", userId: "u3", role: "member", createdAt: new Date("2026-03-01") },
  { id: "m2", userId: "u4", role: "member", createdAt: new Date("2026-04-01") },
];

describe("seatsToRemove", () => {
  it("returns zero when target fits active members", () => {
    expect(seatsToRemove(3, 5)).toBe(0);
    expect(seatsToRemove(3, 3)).toBe(0);
  });

  it("returns difference when downgrading", () => {
    expect(seatsToRemove(4, 2)).toBe(2);
  });
});

describe("suggestMemberIdsToRemove", () => {
  it("never suggests removing the owner", () => {
    const suggested = suggestMemberIdsToRemove(members, 2);
    expect(suggested).toHaveLength(2);
    expect(suggested).not.toContain("owner");
  });

  it("prefers members over admins and newer members first", () => {
    expect(suggestMemberIdsToRemove(members, 2)).toEqual(["m2", "m1"]);
  });
});

describe("validateSeatChange", () => {
  it("requires enough removals on downgrade", () => {
    const result = validateSeatChange({
      members,
      targetSeats: 2,
      removeMemberIds: ["m2"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Choose 2 team members");
    }
  });

  it("accepts valid downgrade selections", () => {
    const result = validateSeatChange({
      members,
      targetSeats: 2,
      removeMemberIds: ["m2", "m1"],
    });
    expect(result.ok).toBe(true);
  });

  it("blocks owner removal", () => {
    const result = validateSeatChange({
      members,
      targetSeats: 1,
      removeMemberIds: ["owner", "m2", "m1"],
    });
    expect(result.ok).toBe(false);
  });
});

describe("removableMembers", () => {
  it("excludes owner", () => {
    expect(removableMembers(members).map((member) => member.id)).not.toContain("owner");
  });
});
