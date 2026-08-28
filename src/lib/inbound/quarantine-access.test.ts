import { describe, expect, it } from "vitest";
import {
  canActOnQuarantineSender,
  quarantineSenderFilter,
} from "@/lib/inbound/quarantine-access";
import type { WorkspaceContext } from "@/lib/session";

function ctx(partial: Partial<WorkspaceContext>): WorkspaceContext {
  return {
    userId: "u1",
    email: "member@example.com",
    name: "Member",
    emailVerified: new Date(),
    hasPassword: true,
    role: "member",
    notifyStoryReady: true,
    workspace: {
      id: "ws1",
      name: "Team",
      plan: "team",
      inboundLocalPart: "team",
      seatQuantity: 3,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      currentPeriodStart: null,
    },
    ...partial,
  };
}

describe("quarantine access", () => {
  it("lets team members act on their own held mail", () => {
    expect(
      canActOnQuarantineSender(ctx({}), "member@example.com"),
    ).toBe(true);
    expect(
      canActOnQuarantineSender(ctx({}), "other@example.com"),
    ).toBe(false);
  });

  it("lets admins act on any held mail", () => {
    expect(
      canActOnQuarantineSender(
        ctx({ role: "admin", email: "admin@example.com" }),
        "other@example.com",
      ),
    ).toBe(true);
  });

  it("filters quarantine list to member email on team plans", () => {
    expect(quarantineSenderFilter(ctx({}))).toEqual({
      fromEmail: "member@example.com",
    });
    expect(
      quarantineSenderFilter(ctx({ role: "admin", email: "admin@example.com" })),
    ).toEqual({});
  });
});
