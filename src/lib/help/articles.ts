import { BRAND_NAME } from "@/lib/brand";

export type HelpSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  sections: HelpSection[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    summary: "Create an account, verify your inbox address, and receive your first story.",
    sections: [
      {
        paragraphs: [
          `${BRAND_NAME} turns forwarded email threads into readable stories. You do not connect Gmail or any inbox directly — you forward mail to your personal ${BRAND_NAME} address.`,
        ],
      },
      {
        heading: "Steps",
        paragraphs: [],
        bullets: [
          "Create an account and verify your email address.",
          `Open Dashboard and copy your ${BRAND_NAME} inbox address.`,
          "Forward a thread from Gmail, Outlook, or any mail client.",
          "Open Stories when you receive the story-ready notification.",
        ],
      },
      {
        heading: "What gets stored",
        paragraphs: [
          "We store the forwarded messages, attachments we accept, and the generated story. Original provider mail stays in your inbox — we only see what you forward. When you delete a story, it moves to Recently deleted for 30 days before permanent removal.",
        ],
      },
    ],
  },
  {
    slug: "gmail-forwarding",
    title: "Forward from Gmail",
    summary: "How to forward individual threads or set up automatic forwarding.",
    sections: [
      {
        paragraphs: [
          `For a single thread, open the message in Gmail, choose Forward, paste your ${BRAND_NAME} address, and send.`,
        ],
      },
      {
        heading: "Automatic forwarding",
        paragraphs: [
          `If you want every message from a label or filter forwarded, create a Gmail filter that forwards matching mail to your ${BRAND_NAME} address. Gmail may ask you to confirm the forwarding address first.`,
        ],
      },
      {
        heading: "Tips",
        bullets: [
          "Forward the whole thread when possible so the story has full context.",
          "Use a verified forwarding address if your workspace requires it.",
          "Replies in the same thread usually attach automatically when headers are intact.",
        ],
      },
      {
        heading: "When the thread grows",
        paragraphs: [
          `If new replies arrive after you already have a story, forward the updated thread again. When ${BRAND_NAME} can match it to the same conversation, we store the new forward and regenerate the entire story from all mail we hold for that thread — recap, narrative, timeline, and action items are rebuilt together, not patched message by message.`,
          "Updating an existing story does not use another of your Free-plan monthly story slots. Automatic regeneration may wait a short period after a recent update, or pause if you hit rate limits; forwarded mail is still saved, and you can generate or refresh from Stories when you are ready.",
        ],
        bullets: [
          "Forward the full updated thread when possible.",
          "Use the same forwarding address as before so we can match the conversation.",
          "Reply headers (In-Reply-To / References) help us attach mail to the right story.",
        ],
      },
    ],
  },
  {
    slug: "recently-deleted-stories",
    title: "Recently deleted stories",
    summary: "What happens when you delete a story and how to restore it within 30 days.",
    sections: [
      {
        paragraphs: [
          `When you delete a story, it is moved to Recently deleted instead of being removed immediately. The story and the forwarded email we stored for it stay recoverable for 30 days.`,
        ],
      },
      {
        heading: "Restore a story",
        bullets: [
          "Open Stories and switch to the Recently deleted tab.",
          "Choose Restore on the story you want back.",
          "Or open the deleted story and choose Restore story from the banner.",
        ],
      },
      {
        heading: "Permanent deletion",
        paragraphs: [
          "You can delete a story permanently at any time from Recently deleted. Permanent deletion removes the story and forwarded email immediately.",
          `Otherwise, stories in Recently deleted are automatically removed after ${30} days, including the forwarded email and attachments we stored. Deleting your entire account removes your data immediately.`,
          "Free-plan quota for the month is not refunded when you delete a story, and restoring a deleted story does not use another monthly slot.",
        ],
      },
    ],
  },
  {
    slug: "story-limits",
    title: "Story limits and fair use",
    summary: "Monthly caps, rate limits, and what happens when you hit a limit.",
    sections: [
      {
        paragraphs: [
          "Free includes a small monthly allowance. Pro includes 500 stories per month. Team includes 500 stories per seat per month. Additional hourly and daily limits protect the service from abuse.",
        ],
      },
      {
        heading: "When you hit a limit",
        bullets: [
          "Your forwarded mail is still stored.",
          "No new AI story is generated until capacity returns or you retry later.",
          "You receive an email explaining why generation was skipped.",
          "Open Stories to see conversations waiting for generation.",
        ],
      },
    ],
  },
  {
    slug: "team-workspaces",
    title: "Team workspaces",
    summary: "Shared inbox, seats, invites, and ownership transfer.",
    sections: [
      {
        paragraphs: [
          "Team plans share one inbound address and one story library. Each member uses a seat. Admins can invite colleagues and manage forwarding rules.",
        ],
      },
      {
        heading: "Admin tasks",
        bullets: [
          "Change seat count from Settings → Team — upgrades bill immediately; downgrades let you choose who to remove.",
          "Invite members from Settings → Team.",
          "Transfer ownership when the primary admin changes.",
          "Enable two-factor authentication on your account in Settings → Account.",
        ],
      },
    ],
  },
  {
    slug: "billing",
    title: "Billing and invoices",
    summary: "Plans, Stripe checkout, failed payments, and refunds.",
    sections: [
      {
        paragraphs: [
          "Upgrade from Settings → Billing. Stripe handles payment details and invoices. If a renewal fails, Pro features may pause until payment succeeds — you will see a banner in the app.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "See our Refunds policy for eligibility. Contact support if billing looks wrong.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    summary: "No story yet, quarantined senders, skipped attachments, and retries.",
    sections: [
      {
        heading: "No story appeared",
        bullets: [
          `Confirm you forwarded to the correct ${BRAND_NAME} address.`,
          "Check whether the sender is verified or allowed for your workspace.",
          `Look for a skip or failure email from ${BRAND_NAME}.`,
          "Open Stories for conversations marked as waiting or pending.",
        ],
      },
      {
        heading: "Quarantined mail",
        paragraphs: [
          "Unknown senders may be held until an admin approves them. Open Dashboard or Settings → Forwarding to release approved senders.",
        ],
      },
      {
        heading: "Attachments",
        paragraphs: [
          "Attachments over 10 MB are not stored. Executable file types and files that fail our security scan are blocked. You will be notified when attachments are skipped.",
        ],
      },
    ],
  },
  {
    slug: "security-and-privacy",
    title: "Security and privacy",
    summary: "Two-factor authentication, data export, deletion, and GDPR requests.",
    sections: [
      {
        paragraphs: [
          "Enable two-factor authentication in Settings → Account to protect every sign-in method. Export or delete your account from Settings → Privacy & data. GDPR requests are available from the Data Request page linked in the footer.",
        ],
      },
      {
        heading: "Deleting stories",
        bullets: [
          "Deleting a story moves it to Recently deleted for 30 days.",
          "You can restore a story from Recently deleted during that period.",
          "After 30 days, or if you delete permanently, the story and forwarded email are removed.",
          "Deleting your entire account removes your data immediately.",
        ],
      },
    ],
  },
  {
    slug: "contact-support",
    title: "Contact support",
    summary: "How to reach us and what to include in your message.",
    sections: [
      {
        paragraphs: [
          "Email support@mailtostory.com with your account email, workspace inbound address, and a short description of the issue. For missing stories, include the original subject line and approximate forward time.",
        ],
      },
    ],
  },
];

export const HELP_ARTICLE_BY_SLUG = Object.fromEntries(
  HELP_ARTICLES.map((article) => [article.slug, article]),
) as Record<string, HelpArticle>;

export const HELP_ARTICLE_SLUGS = HELP_ARTICLES.map((article) => article.slug);
