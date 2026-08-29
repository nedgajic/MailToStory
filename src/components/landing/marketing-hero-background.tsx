import type { CSSProperties } from "react";
import { MARKETING_SAMPLE_SUBJECT, MARKETING_SAMPLE_THREAD } from "@/lib/marketing-sample-thread";

const SLIDE_COUNT = 4;
const SLIDE_DURATION_S = 7;

type HeroSlide = {
  id: string;
  clientClass: string;
};

const HERO_SLIDES: HeroSlide[] = [
  { id: "gmail", clientClass: "mkt-hero-client--gmail" },
  { id: "apple", clientClass: "mkt-hero-client--apple" },
  { id: "outlook", clientClass: "mkt-hero-client--outlook" },
  { id: "spark", clientClass: "mkt-hero-client--spark" },
];

const THREAD_SUBJECT = MARKETING_SAMPLE_SUBJECT;
const THREAD_PREVIEW = MARKETING_SAMPLE_THREAD[0]?.body.split("\n\n")[0] ?? "";

function slideStyle(index: number): CSSProperties {
  return {
    animationDuration: `${SLIDE_COUNT * SLIDE_DURATION_S}s`,
    animationDelay: `${-index * SLIDE_DURATION_S}s`,
  };
}

function HeroEmailClient({ className }: { className: string }) {
  return (
    <div className={`mkt-hero-client ${className}`}>
      <div className="mkt-hero-client__window">
        <div className="mkt-hero-client__chrome">
          <span />
          <span />
          <span />
        </div>

        <div className="mkt-hero-client__topbar">
          <span className="mkt-hero-client__brand" />
          <span className="mkt-hero-client__search" />
        </div>

        <div className="mkt-hero-client__body">
          <aside className="mkt-hero-client__sidebar">
            <span className="mkt-hero-client__compose">Compose</span>
            <span className="mkt-hero-client__folder mkt-hero-client__folder--active">
              Inbox
            </span>
            <span className="mkt-hero-client__folder">Sent</span>
            <span className="mkt-hero-client__folder">Drafts</span>
          </aside>

          <div className="mkt-hero-client__list">
            <div className="mkt-hero-client__thread mkt-hero-client__thread--active">
              <span className="mkt-hero-client__thread-from">Priya · Daniel · Rachel</span>
              <span className="mkt-hero-client__thread-subject">{THREAD_SUBJECT}</span>
              <span className="mkt-hero-client__thread-preview">
                {THREAD_PREVIEW.slice(0, 58)}…
              </span>
              <span className="mkt-hero-client__thread-count">4</span>
            </div>
            <div className="mkt-hero-client__thread">
              <span className="mkt-hero-client__thread-from">Weekly digest</span>
              <span className="mkt-hero-client__thread-subject">Your open approvals</span>
              <span className="mkt-hero-client__thread-preview">3 items waiting on you</span>
            </div>
            <div className="mkt-hero-client__thread">
              <span className="mkt-hero-client__thread-from">Support</span>
              <span className="mkt-hero-client__thread-subject">Invoice attached</span>
              <span className="mkt-hero-client__thread-preview">PDF for Q3 renewal</span>
            </div>
          </div>

          <div className="mkt-hero-client__conversation">
            <p className="mkt-hero-client__subject">{THREAD_SUBJECT}</p>
            <div className="mkt-hero-client__messages">
              <article className="mkt-hero-client__message">
                <span className="mkt-hero-client__avatar" />
                <div>
                  <p className="mkt-hero-client__meta">Priya Sharma · Tue 9:12</p>
                  <p className="mkt-hero-client__text">
                    Mixpanel contract ends June 30 — need a decision by March 28. Usage
                    report attached; Eng and Finance input requested this week.
                  </p>
                </div>
              </article>
              <article className="mkt-hero-client__message mkt-hero-client__message--reply">
                <span className="mkt-hero-client__avatar mkt-hero-client__avatar--alt" />
                <div>
                  <p className="mkt-hero-client__meta">Daniel Okonkwo · Tue 2:41</p>
                  <p className="mkt-hero-client__text">
                    Lean renew — migration is ~3 sprints and we'd lose tuned funnels.
                    PostHog is cheaper but needs rebuilt dashboards.
                  </p>
                </div>
              </article>
              <article className="mkt-hero-client__message mkt-hero-client__message--reply">
                <span className="mkt-hero-client__avatar mkt-hero-client__avatar--finance" />
                <div>
                  <p className="mkt-hero-client__meta">Rachel Kim · Wed 10:05</p>
                  <p className="mkt-hero-client__text">
                    Budget cap is $18,400/yr vs $21,200 proposal. Need quarterly true-up
                    and no auto-renew above CPI.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketingHeroBackground() {
  return (
    <div className="mkt-hero__bg" aria-hidden="true">
      <div className="mkt-hero__slides">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className="mkt-hero__slide"
            style={slideStyle(index)}
          >
            <HeroEmailClient className={slide.clientClass} />
          </div>
        ))}
      </div>
      <div className="mkt-hero__overlay" />
      <div className="mkt-hero__grad" />
      <div className="mkt-hero__grain" />
    </div>
  );
}
