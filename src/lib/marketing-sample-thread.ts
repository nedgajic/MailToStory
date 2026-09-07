import type { Digest } from "@/lib/digest-schema";

export type MarketingThreadMessage = {
  index: number;
  from: { name: string; email: string; title: string };
  sentAt: string;
  subject: string;
  body: string;
  quoted?: string;
  attachment?: string;
};

export const MARKETING_SAMPLE_SUBJECT = "Re: Analytics platform renewal — Q3 budget";

export const MARKETING_SAMPLE_THREAD: MarketingThreadMessage[] = [
  {
    index: 1,
    from: {
      name: "Priya Sharma",
      email: "priya.sharma@northline.io",
      title: "Head of Operations",
    },
    sentAt: "Tue, Mar 4, 9:12 AM",
    subject: "Analytics platform renewal — Q3 budget",
    body: "Hi all — our Mixpanel contract ends June 30. We need a firm decision by March 28 on renew vs. evaluate alternatives.\n\nI've attached last year's usage report. Can Engineering and Finance weigh in this week? Ideally we'd align before the vendor's renewal window closes.",
    attachment: "mixpanel-usage-2025.pdf",
  },
  {
    index: 2,
    from: {
      name: "Daniel Okonkwo",
      email: "daniel.okonkwo@northline.io",
      title: "Engineering Lead",
    },
    sentAt: "Tue, Mar 4, 2:41 PM",
    subject: MARKETING_SAMPLE_SUBJECT,
    body: "From an engineering standpoint I'd lean renew — migration to another stack is roughly three sprints, and we'd lose funnels we've tuned over two years.\n\nPostHog is cheaper on paper, but we'd need to rebuild dashboards and event schemas. Happy to put together a one-pager if helpful.",
    quoted:
      "…We need a firm decision by March 28 on renew vs. evaluate alternatives…",
  },
  {
    index: 3,
    from: {
      name: "Rachel Kim",
      email: "rachel.kim@northline.io",
      title: "Finance Director",
    },
    sentAt: "Wed, Mar 5, 10:05 AM",
    subject: MARKETING_SAMPLE_SUBJECT,
    body: "Finance can approve up to $18,400/yr all-in. The current Mixpanel proposal is $21,200.\n\nIf we renew, we need quarterly true-up language and no auto-renew above CPI. Also please confirm whether the Eng estimate includes contractor support.",
    quoted: "…migration to another stack is roughly three sprints…",
  },
  {
    index: 4,
    from: {
      name: "Priya Sharma",
      email: "priya.sharma@northline.io",
      title: "Head of Operations",
    },
    sentAt: "Wed, Mar 5, 4:18 PM",
    subject: MARKETING_SAMPLE_SUBJECT,
    body: "Thanks both. Let's target renew if Mixpanel meets the $18.4k cap.\n\nDaniel — can you send a side-by-side (Mixpanel vs PostHog) by Friday? I'll schedule a 30-min call with their rep for Monday 11:00.",
    quoted: "…Finance can approve up to $18,400/yr all-in…",
  },
  {
    index: 5,
    from: {
      name: "Daniel Okonkwo",
      email: "daniel.okonkwo@northline.io",
      title: "Engineering Lead",
    },
    sentAt: "Thu, Mar 6, 8:52 AM",
    subject: MARKETING_SAMPLE_SUBJECT,
    body: "Side-by-side deck attached. Short version: renew saves ~3 sprints and keeps our funnel baselines intact.\n\nCalendar link for Monday is in slide 2 — I'll join and can walk through migration risk if needed.",
    attachment: "analytics-renewal-comparison.pptx",
    quoted: "…can you send a side-by-side (Mixpanel vs PostHog) by Friday?…",
  },
];

export const MARKETING_SAMPLE_DIGEST: Digest = {
  title: "Analytics platform renewal — Q3 budget",
  resolution_summary:
    "The team is aligned on renewing Mixpanel if the vendor meets Finance's $18,400/yr cap with quarterly true-up and CPI-limited auto-renew. Daniel will deliver a vendor comparison by Friday; Priya scheduled a procurement call for Monday.",
  status: "pending_action",
  narrative: [
    {
      type: "prose",
      speaker: "Priya Sharma",
      message_index: 1,
      content:
        "Priya opened the thread noting the Mixpanel contract ends June 30 and asked for a decision by March 28 on renew versus evaluating alternatives. She attached last year's usage report and requested input from Engineering and Finance within the week.",
    },
    {
      type: "attachment_reference",
      filename: "mixpanel-usage-2025.pdf",
      context: "Last year's Mixpanel usage report for renewal planning.",
      speaker: "Priya Sharma",
      message_index: 1,
    },
    {
      type: "prose",
      speaker: "Daniel Okonkwo",
      message_index: 2,
      content:
        "Daniel recommended renewing from an engineering perspective. He estimated migrating to another platform would take about three sprints and would lose funnels tuned over two years. PostHog might be cheaper, but rebuilding dashboards and event schemas would add significant cost.",
    },
    {
      type: "prose",
      speaker: "Rachel Kim",
      message_index: 3,
      content:
        "Rachel set Finance's approval ceiling at $18,400 per year all-in, below Mixpanel's $21,200 proposal. She asked for quarterly true-up language, no auto-renew above CPI, and confirmation that Engineering's estimate includes contractor support.",
    },
    {
      type: "prose",
      speaker: "Priya Sharma",
      message_index: 4,
      content:
        "Priya summarized the direction: renew if Mixpanel meets the $18.4k cap. She asked Daniel for a Mixpanel-versus-PostHog comparison by Friday and said she would schedule a 30-minute vendor call for Monday at 11:00.",
    },
    {
      type: "prose",
      speaker: "Daniel Okonkwo",
      message_index: 5,
      content:
        "Daniel shared a side-by-side deck and noted that renewing avoids roughly three sprints of migration work and preserves existing funnel baselines. He included a calendar link for Monday's call and offered to walk through migration risk live.",
    },
    {
      type: "attachment_reference",
      filename: "analytics-renewal-comparison.pptx",
      context: "Mixpanel vs PostHog comparison; slide 2 includes the Monday meeting link.",
      speaker: "Daniel Okonkwo",
      message_index: 5,
    },
  ],
  timeline: [
    {
      date: "2026-03-04",
      actor: "Priya Sharma",
      summary: "Raised renewal deadline and requested Eng/Finance input.",
      message_index: 1,
    },
    {
      date: "2026-03-04",
      actor: "Daniel Okonkwo",
      summary: "Recommended renew; flagged ~3-sprint migration cost vs PostHog.",
      message_index: 2,
    },
    {
      date: "2026-03-05",
      actor: "Rachel Kim",
      summary: "Set $18.4k budget cap and contract terms Finance requires.",
      message_index: 3,
    },
    {
      date: "2026-03-05",
      actor: "Priya Sharma",
      summary: "Aligned on renew-if-pricing works; requested comparison by Friday.",
      message_index: 4,
    },
    {
      date: "2026-03-06",
      actor: "Daniel Okonkwo",
      summary: "Delivered comparison deck and Monday meeting link.",
      message_index: 5,
    },
  ],
  action_items: [
    {
      owner: "Daniel Okonkwo",
      action: "Join Monday 11:00 vendor call and walk through migration risk.",
      due: "2026-03-10",
    },
    {
      owner: "Priya Sharma",
      action: "Confirm Mixpanel meets $18.4k cap with quarterly true-up language.",
      due: "2026-03-10",
    },
    {
      owner: "Rachel Kim",
      action: "Review revised contract for CPI-limited auto-renew clause.",
      due: "2026-03-12",
    },
  ],
  participants: [
    {
      name: "Priya Sharma",
      email: "priya.sharma@northline.io",
      role: "Head of Operations",
    },
    {
      name: "Daniel Okonkwo",
      email: "daniel.okonkwo@northline.io",
      role: "Engineering Lead",
    },
    {
      name: "Rachel Kim",
      email: "rachel.kim@northline.io",
      role: "Finance Director",
    },
  ],
};
