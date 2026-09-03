import { describe, expect, it } from "vitest";
import {
  buildParticipantLaneMap,
  participantLaneIndex,
  moonletterParticipantPanelLayout,
  wayfarerPanelOffsetPercent,
} from "./participantColors";

describe("wayfarer participant lanes", () => {
  const participants = [
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
    { name: "Carol", email: "carol@example.com" },
  ];

  it("assigns stable lane slots in participant order", () => {
    const lanes = buildParticipantLaneMap(participants);
    expect(lanes.get("alice@example.com")).toBe(0);
    expect(lanes.get("bob@example.com")).toBe(1);
    expect(lanes.get("carol@example.com")).toBe(2);
  });

  it("maps speakers to their lane slot", () => {
    const lanes = buildParticipantLaneMap(participants);
    expect(
      participantLaneIndex(participants, "Bob", "bob@example.com", lanes),
    ).toBe(1);
  });

  it("spreads two participants to the edges for 80% panels", () => {
    const two = buildParticipantLaneMap(participants.slice(0, 2));
    expect(wayfarerPanelOffsetPercent(0, two.size)).toBe("0");
    expect(wayfarerPanelOffsetPercent(1, two.size)).toBe(
      "calc(var(--wayfarer-recap-panel-width, 100%) * 1 * 0.2)",
    );
  });

  it("centers a lone participant", () => {
    const one = buildParticipantLaneMap(participants.slice(0, 1));
    expect(wayfarerPanelOffsetPercent(0, one.size)).toBe(
      "calc(var(--wayfarer-recap-panel-width, 100%) * 0.1)",
    );
  });
});

describe("moonletter participant panels", () => {
  it("assigns stable width and offset in range", () => {
    const first = moonletterParticipantPanelLayout("alice@example.com");
    const again = moonletterParticipantPanelLayout("alice@example.com");
    expect(first).toEqual(again);
    expect(first.widthRatio).toBeGreaterThanOrEqual(0.7);
    expect(first.widthRatio).toBeLessThanOrEqual(0.95);
    expect(first.offsetRatio).toBeGreaterThanOrEqual(0);
    expect(first.offsetRatio).toBeLessThanOrEqual(1 - first.widthRatio + 0.0001);
  });

  it("can differ between participants", () => {
    const alice = moonletterParticipantPanelLayout("alice@example.com");
    const bob = moonletterParticipantPanelLayout("bob@example.com");
    expect(
      alice.widthRatio !== bob.widthRatio ||
        alice.offsetRatio !== bob.offsetRatio,
    ).toBe(true);
  });
});
