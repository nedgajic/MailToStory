import { describe, expect, it } from "vitest";
import {
  parseForwardedThread,
  preprocessMessages,
  stripQuotedReplies,
  stripSubjectPrefix,
} from "@/lib/preprocessThread";
import { extractLocalParts } from "@/lib/inbound/postmark";
import { monthlyAmountUsd, storyLimitForPlan } from "@/lib/billing/plans";

describe("stripQuotedReplies", () => {
  it("removes Apple Mail style On … wrote: tail", () => {
    const t = [
      "Hi Ned,",
      "",
      "Thanks for your understanding.",
      "",
      "Cheers",
      "Craig",
      "",
      "On 27 Apr 2026, at 8:46 pm, Ned Gajic <ned@gmail.com> wrote:",
      "Hi Craig, this is the quoted part...",
    ].join("\n");
    const out = stripQuotedReplies(t);
    expect(out).toContain("Thanks for your understanding");
    expect(out).not.toContain("Ned Gajic");
    expect(out).not.toContain("quoted part");
  });

  it("removes quote-prefix lines", () => {
    const t = "Hello\n> quoted\nmore";
    expect(stripQuotedReplies(t)).not.toContain("quoted");
  });
});

describe("preprocessMessages", () => {
  it("extracts subject and participants", () => {
    const result = preprocessMessages([
      {
        id: "m1",
        from: "Ada Lovelace <ada@example.com>",
        date: "Mon, 1 Jan 2024 10:00:00 +0000",
        subject: "Re: Project",
        text: "Starting the thread.",
      },
    ]);
    expect(result.metadata.subject).toBe("Project");
    expect(result.metadata.participants[0]?.email).toBe("ada@example.com");
    expect(result.cleanedThread).toContain("Starting the thread");
  });
});

describe("parseForwardedThread", () => {
  it("splits original message markers", () => {
    const parts = parseForwardedThread(
      "Please see below.\n\n-----Original Message-----\nFrom: Bob <bob@x.com>\nHello team",
      "Ada <ada@x.com>",
      "2026-01-01",
      "Fwd: Hello",
    );
    expect(parts.length).toBeGreaterThan(1);
  });

  it("splits Gmail list-view forwards with nested wrote blocks", () => {
    const text = [
      "---------- Forwarded message ---------",
      "From: wynwood tech Recruiting <recruiting@wynwd.com>",
      "Date: Sat, Jul 25, 2026 at 10:21 AM",
      "Subject: Re: Data Scientists",
      "To: <nedgajic@gmail.com>",
      "",
      "Hi Nedeljko,",
      "",
      "Latest outreach.",
      "On Wed, Jul 22, 2026 at 09:18 AM EDT, wynwood tech Recruiting <",
      "recruiting@wynwd.com> wrote:",
      "",
      "Reminder note.",
      "On Tue, Jul 21, 2026 at 07:50 AM EDT, wynwood tech Recruiting <",
      "recruiting@wynwd.com> wrote:",
      "",
      "Initial outreach.",
    ].join("\n");

    const parts = parseForwardedThread(
      text,
      "Ned Gajic <nedgajic@gmail.com>",
      "2026-09-05",
      "Fwd: Data Scientists",
    );

    expect(parts.length).toBe(3);
    expect(parts[0]?.text).toContain("Initial outreach");
    expect(parts[2]?.text).toContain("Latest outreach");
    expect(parts[0]?.from).toContain("recruiting@wynwd.com");
  });
});

describe("stripSubjectPrefix", () => {
  it("strips fwd", () => {
    expect(stripSubjectPrefix("Fwd: Hello")).toBe("Hello");
  });
});

describe("extractLocalParts", () => {
  it("finds inbox domain addresses", () => {
    const parts = extractLocalParts(
      { To: "k7f2n9@inbox.mailtostory.com" },
      "inbox.mailtostory.com",
    );
    expect(parts).toEqual(["k7f2n9"]);
  });
});

describe("plans", () => {
  it("limits free stories", () => {
    expect(storyLimitForPlan("free")).toBe(5);
    expect(storyLimitForPlan("pro")).toBeNull();
    expect(monthlyAmountUsd("team", 3)).toBe(74.97);
  });
});
