import { describe, expect, it } from "vitest";
import { filterStoryNotificationRecipients } from "@/lib/email/story-notifications";

describe("filterStoryNotificationRecipients", () => {
  const members = [
    {
      notifyStoryReady: true,
      user: { id: "u1", email: "alice@example.com", name: "Alice" },
    },
    {
      notifyStoryReady: true,
      user: { id: "u2", email: "bob@example.com", name: "Bob" },
    },
    {
      notifyStoryReady: false,
      user: { id: "u3", email: "carol@example.com", name: "Carol" },
    },
  ];

  it("notifies all opted-in team members regardless of forwarder", () => {
    const recipients = filterStoryNotificationRecipients({
      plan: "team",
      forwarderEmail: "external@client.com",
      members,
    });
    expect(recipients.map((r) => r.email).sort()).toEqual([
      "alice@example.com",
      "bob@example.com",
    ]);
  });

  it("notifies only the matching forwarder on solo plans", () => {
    const recipients = filterStoryNotificationRecipients({
      plan: "pro",
      forwarderEmail: "Alice@Example.com",
      members,
    });
    expect(recipients).toEqual([
      {
        userId: "u1",
        email: "alice@example.com",
        name: "Alice",
      },
    ]);
  });

  it("returns no solo recipients when forwarder email does not match", () => {
    const recipients = filterStoryNotificationRecipients({
      plan: "free",
      forwarderEmail: "other@example.com",
      members,
    });
    expect(recipients).toEqual([]);
  });
});
