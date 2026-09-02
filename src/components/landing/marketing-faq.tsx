"use client";

import { useState } from "react";
import { BRAND_NAME } from "@/lib/brand";

const FAQ_ITEMS = [
  {
    q: "Do you connect to my Gmail or inbox?",
    a: `No. ${BRAND_NAME} never requests inbox access. You forward only the threads you choose to your private address.`,
  },
  {
    q: "Which email apps work?",
    a: "Any app that can forward mail — Gmail, Outlook, Apple Mail, and others. Forward the whole thread as one message when possible.",
  },
  {
    q: "What happens if I forward the same thread again after new replies?",
    a: `When we recognize it as the same conversation (reply headers or the same subject from you within a few days), we add the new forward to that thread and regenerate the whole story from everything we've stored — not just the latest message. You keep one story in your library; the recap, timeline, and action items are rebuilt so they reflect the full thread.\n\nOn the Free plan, updating an existing story doesn't use another of your five monthly "new story" slots. Updates can be delayed briefly if a story was just regenerated, or if you've hit rate limits — your mail is still saved, and you can refresh the story from Stories when ready.\n\nFor best results, forward the full updated thread when you can, and forward from the same address you used before so we can match the conversation.`,
  },
  {
    q: "What happens on the Free plan?",
    a: "You get a private inbound address and five stories per calendar month. Forwarded mail is stored until you delete the story. Deleted stories stay in Recently deleted for 30 days before permanent removal.",
  },
  {
    q: "What happens if I hit the monthly limit?",
    a: "On Free, you get five new stories per calendar month. On Pro and Team, fair use is 500 stories per month (500 per seat on Team). If you hit the cap, we still store forwarded mail, but we pause new AI generation until the next month or until you upgrade. Open Stories to retry manually once you have capacity.",
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
