"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Do you connect to my Gmail or inbox?",
    a: "No. MailToStory never requests inbox access. You forward only the threads you choose to your private address.",
  },
  {
    q: "Which email apps work?",
    a: "Any app that can forward mail — Gmail, Outlook, Apple Mail, and others. Forward the whole thread as one message when possible.",
  },
  {
    q: "What happens on the Free plan?",
    a: "You get a private inbound address and five stories per calendar month. Forwarded mail is stored until you delete the story.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Delete individual stories, bulk-delete by month or year, or delete your entire account from Settings.",
  },
  {
    q: "Is my mail used to train AI models?",
    a: "No. Stories are generated on demand with Gemini for your account only. We do not sell mail or use it for general model training.",
  },
] as const;

export function MarketingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mkt-faq">
      {FAQ_ITEMS.map((item, index) => {
        const expanded = open === index;
        return (
          <article key={item.q} className="mkt-faq__item">
            <button
              type="button"
              className="mkt-faq__trigger"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : index)}
            >
              <span>{item.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={expanded ? "mkt-faq__chev mkt-faq__chev--open" : "mkt-faq__chev"}
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {expanded ? <p className="mkt-faq__answer">{item.a}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
