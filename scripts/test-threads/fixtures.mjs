/** @typedef {{ from: string; date: string; subject: string; body: string }} ThreadMessage */

/**
 * @param {string} forwardNote
 * @param {ThreadMessage[]} messages chronological (oldest first)
 */
export function buildForwardedBody(forwardNote, messages) {
  const blocks = messages.map(
    (m) =>
      `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\n\n${m.body.trim()}`,
  );
  return `${forwardNote.trim()}\n\n${blocks.join("\n\n")}`;
}

const d = (day, hour, min = 0) =>
  `Mon, ${day} Mar 2026 ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00 +0000`;

/** 4 turns · 3 participants */
export const thread1 = {
  id: "t1-budget",
  subject: "Fwd: Q2 Marketing Campaign Budget",
  forwardNote:
    "Looping everyone — can we lock numbers before Friday's leadership review?",
  messages: [
    {
      from: "Alice Chen <alice.chen@northline.io>",
      date: d(3, 9, 0),
      subject: "Q2 Marketing Campaign Budget",
      body: `Hi Bob and Carol,

I'm drafting the Q2 paid media plan. Initial ask is €48k across LinkedIn, newsletter sponsorships, and one conference booth.

Can you both sanity-check channel split before I send finance the worksheet?

Alice`,
    },
    {
      from: "Bob Martinez <bob.martinez@northline.io>",
      date: d(3, 10, 15),
      subject: "Re: Q2 Marketing Campaign Budget",
      body: `Alice — LinkedIn is fine, but €18k on the booth feels high if we are not keynote-level.

Could we shift €6k into a customer webinar series? Carol's team could co-host.

Bob`,
    },
    {
      from: "Carol Webb <carol.webb@northline.io>",
      date: d(3, 11, 40),
      subject: "Re: Q2 Marketing Campaign Budget",
      body: `+1 on the webinar idea. We have three customers who already agreed to speak if we cover production.

If we drop the booth to €12k, I can commit two case-study videos by end of April.

Carol`,
    },
    {
      from: "Alice Chen <alice.chen@northline.io>",
      date: d(3, 14, 5),
      subject: "Re: Q2 Marketing Campaign Budget",
      body: `Updated sheet attached in the deck folder — booth €12k, webinars €6k, rest unchanged.

I'll send finance the final version tomorrow unless I hear otherwise by 5pm CET.

Alice`,
    },
  ],
};

/** 7 turns · 4 participants */
export const thread2 = {
  id: "t2-office",
  subject: "Fwd: Office relocation — Ljubljana floor plan",
  forwardNote: "Full thread on the move — need decisions on desks and parking.",
  messages: [
    {
      from: "Dana Novak <dana.novak@brightpath.si>",
      date: d(4, 8, 30),
      subject: "Office relocation — Ljubljana floor plan",
      body: `Team,

We signed the lease for Tržaška 12. Move-in window is 14–18 April.

Erik, can facilities confirm network drop locations? Fiona and Gregor, please flag any team-specific needs by Wednesday.

Dana`,
    },
    {
      from: "Erik Horvat <erik.horvat@brightpath.si>",
      date: d(4, 9, 10),
      subject: "Re: Office relocation — Ljubljana floor plan",
      body: `Dana — ISP can deliver fiber on 10 April. We need a marked plan for AP placement before then.

I'll walk the floor Thursday morning.

Erik`,
    },
    {
      from: "Fiona Walsh <fiona.walsh@brightpath.si>",
      date: d(4, 9, 45),
      subject: "Re: Office relocation — Ljubljana floor plan",
      body: `Design team needs two walls with proper lighting for color review. Also requesting four sit-stand desks near windows.

Fiona`,
    },
    {
      from: "Gregor Kovač <gregor.kovac@brightpath.si>",
      date: d(4, 10, 20),
      subject: "Re: Office relocation — Ljubljana floor plan",
      body: `Engineering wants a quiet room for interviews and a lockable rack closet on the same floor.

Happy to share our current desk map if it helps.

Gregor`,
    },
    {
      from: "Dana Novak <dana.novak@brightpath.si>",
      date: d(4, 13, 0),
      subject: "Re: Office relocation — Ljubljana floor plan",
      body: `Thanks all. I'm consolidating requests into one layout draft.

Parking: we get 18 spots — prioritizing folks with medical needs and late shifts first.

Dana`,
    },
    {
      from: "Erik Horvat <erik.horvat@brightpath.si>",
      date: d(4, 15, 30),
      subject: "Re: Office relocation — Ljubljana floor plan",
      body: `AP plan draft is in the shared drive. Marked two interview rooms per Gregor's note.

Erik`,
    },
    {
      from: "Dana Novak <dana.novak@brightpath.si>",
      date: d(4, 16, 45),
      subject: "Re: Office relocation — Ljubljana floor plan",
      body: `Layout v2 is ready for sign-off. Unless someone objects by tomorrow 10am, I'll send it to the landlord.

Dana`,
    },
  ],
};

/** 3 turns · 2 participants */
export const thread3 = {
  id: "t3-contract",
  subject: "Fwd: Annual support contract renewal",
  forwardNote: "Can you two finalize pricing today?",
  messages: [
    {
      from: "Helen Park <helen.park@lumenhealth.com>",
      date: d(5, 9, 0),
      subject: "Annual support contract renewal",
      body: `Ian,

Our enterprise support renewal is due 31 March. Legal approved the MSA appendix — we need final tier pricing for 24/7 vs business-hours.

Helen`,
    },
    {
      from: "Ian Brooks <ian.brooks@lumenhealth.com>",
      date: d(5, 10, 30),
      subject: "Re: Annual support contract renewal",
      body: `Helen — recommend 24/7 for production clusters only. Business-hours for staging saves ~€22k annually.

I attached the comparison table in Confluence (link in ticket SUP-4412).

Ian`,
    },
    {
      from: "Helen Park <helen.park@lumenhealth.com>",
      date: d(5, 11, 15),
      subject: "Re: Annual support contract renewal",
      body: `Works for me. I'll send the customer the business-hours option with an upgrade path.

Please confirm SLA language on response times before I hit send.

Helen`,
    },
  ],
};

/** 12 turns · 5 participants */
export const thread4 = {
  id: "t4-summit",
  subject: "Fwd: DevOps Summit 2026 — run of show",
  forwardNote: "Summit thread — photos of the venue and draft agenda attached.",
  messages: [
    {
      from: "James Liu <james.liu@stackforge.dev>",
      date: d(6, 8, 0),
      subject: "DevOps Summit 2026 — run of show",
      body: `Team,

We are six weeks out. Draft agenda is below — need owners for each block and AV requirements.

James`,
    },
    {
      from: "Kate O'Brien <kate.obrien@stackforge.dev>",
      date: d(6, 8, 45),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `I'll own the opening keynote dry-run. Need wireless mics for panel 2.`,
    },
    {
      from: "Liam Müller <liam.muller@stackforge.dev>",
      date: d(6, 9, 20),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Workshop track: cap at 40 seats. Please add a waitlist form to the registration page.`,
    },
    {
      from: "Maria Santos <maria.santos@stackforge.dev>",
      date: d(6, 10, 0),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Catering headcount due Friday. Vegetarian/vegan ratio last year was 35% — using that again unless someone disagrees.`,
    },
    {
      from: "Noah Kim <noah.kim@stackforge.dev>",
      date: d(6, 10, 40),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Sponsor lounge power drops — electrician visit scheduled Monday.`,
    },
    {
      from: "James Liu <james.liu@stackforge.dev>",
      date: d(6, 11, 30),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Thanks. I'm attaching venue photos and floor plan markup for AV vendor.`,
    },
    {
      from: "Kate O'Brien <kate.obrien@stackforge.dev>",
      date: d(6, 13, 15),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Panelists confirmed: all three. Bios needed by next Tuesday.`,
    },
    {
      from: "Liam Müller <liam.muller@stackforge.dev>",
      date: d(6, 14, 0),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Waitlist live. 12 signups in the first hour.`,
    },
    {
      from: "Maria Santos <maria.santos@stackforge.dev>",
      date: d(6, 15, 10),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Caterer can do gluten-free lunch boxes if we confirm by 20 March.`,
    },
    {
      from: "Noah Kim <noah.kim@stackforge.dev>",
      date: d(6, 16, 0),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `AV quote approved. Backup projector added per James's request.`,
    },
    {
      from: "James Liu <james.liu@stackforge.dev>",
      date: d(6, 16, 45),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Run-of-show v3 published. Please comment inline by EOD Thursday.`,
    },
    {
      from: "Kate O'Brien <kate.obrien@stackforge.dev>",
      date: d(6, 17, 30),
      subject: "Re: DevOps Summit 2026 — run of show",
      body: `Commented on panel timing — suggest 10 min audience Q&A instead of 5.`,
    },
  ],
};

function erpMessages() {
  const people = [
    ["Petra Žnidaršič", "petra.znidarsic@meridian.si"],
    ["Tomáš Horák", "tomas.horak@meridian.si"],
    ["Amina Hassan", "amina.hassan@meridian.si"],
    ["Rui Costa", "rui.costa@meridian.si"],
    ["Yuki Tanaka", "yuki.tanaka@meridian.si"],
    ["Olivia Grant", "olivia.grant@meridian.si"],
    ["Marc Dubois", "marc.dubois@meridian.si"],
  ];
  const topics = [
    "cutover weekend staffing",
    "data migration validation",
    "training schedule for warehouse team",
    "rollback criteria",
    "integration with payroll",
    "UAT sign-off checklist",
    "vendor hypercare hours",
    "chart of accounts mapping",
    "permissions matrix",
    "performance test results",
    "open defect triage",
    "steering committee deck",
    "go/no-go agenda",
    "communications plan",
    "backup restore drill",
    "inventory freeze window",
    "API rate limits",
    "helpdesk scripts",
    "executive summary",
    "final risk log",
    "legal approval",
  ];
  /** @type {ThreadMessage[]} */
  const messages = [];
  for (let i = 0; i < 21; i++) {
    const [name, email] = people[i % 7];
    const hour = 8 + Math.floor(i / 2);
    const min = (i % 2) * 25;
    messages.push({
      from: `${name} <${email}>`,
      date: d(7, Math.min(hour, 17), min),
      subject: i === 0 ? "ERP Migration Wave 2" : "Re: ERP Migration Wave 2",
      body: `${topics[i]}: ${i % 3 === 0 ? "blocked on vendor ticket ERP-" + (4400 + i) : "on track for 22 March cutover"}.`,
    });
  }
  messages.push({
    from: "Petra Žnidaršič <petra.znidarsic@meridian.si>",
    date: d(7, 17, 10),
    subject: "Re: ERP Migration Wave 2",
    body: `Pozdravljeni,

finance potrebuje še potrditev saldakontov pred zamrznitvijo zalog. Prosim pošljite izvoz do 18:00.

Petra`,
  });
  messages.push({
    from: "Marc Dubois <marc.dubois@meridian.si>",
    date: d(7, 17, 45),
    subject: "Re: ERP Migration Wave 2",
    body: `Merci Petra — j'envoie le fichier dans dix minutes. L'équipe entrepôt est prévenue pour l'inventaire.

Marc`,
  });
  return messages;
}

/** 23 turns · 7 participants (last 2 in Slovenian / French) */
export const thread5 = {
  id: "t5-erp",
  subject: "Fwd: ERP Migration Wave 2",
  forwardNote:
    "Long migration thread — last messages from Petra and Marc in local languages.",
  messages: erpMessages(),
};

export const ALL_THREADS = [thread1, thread2, thread3, thread4, thread5];
