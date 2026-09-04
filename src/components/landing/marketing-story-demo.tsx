"use client";

import {
  MARKETING_SAMPLE_DIGEST,
  MARKETING_SAMPLE_SUBJECT,
  MARKETING_SAMPLE_THREAD,
  type MarketingThreadMessage,
} from "@/lib/marketing-sample-thread";
import { MarketingInteractiveStoryPreview } from "@/components/landing/marketing-interactive-story-preview";
import "@/app/marketing-demo.css";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function DemoSpeakerAvatar({ name }: { name: string }) {
  return (
    <div className="digest-speaker-avatar mkt-demo-speaker-avatar" aria-hidden="true">
      <span className="digest-speaker-avatar-initials">{getInitials(name)}</span>
    </div>
  );
}

function DemoThreadMessage({ message }: { message: MarketingThreadMessage }) {
  return (
    <article className="mkt-demo-thread__message">
      <header className="mkt-demo-thread__message-head">
        <DemoSpeakerAvatar name={message.from.name} />
        <div className="mkt-demo-thread__message-meta">
          <div className="mkt-demo-thread__message-from">
            <strong>{message.from.name}</strong>
            <span>{message.from.title}</span>
          </div>
          <div className="mkt-demo-thread__message-to">
            To: ops-leads@northline.io · {message.sentAt}
          </div>
        </div>
        <span className="mkt-demo-thread__message-num">#{message.index}</span>
      </header>
      <p className="mkt-demo-thread__subject">{message.subject}</p>
      <div className="mkt-demo-thread__body">
        {message.body.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        {message.attachment ? (
          <div className="mkt-demo-thread__attachment">
            <span aria-hidden="true">📎</span>
            {message.attachment}
          </div>
        ) : null}
        {message.quoted ? (
          <blockquote className="mkt-demo-thread__quote">{message.quoted}</blockquote>
        ) : null}
      </div>
    </article>
  );
}

export function MarketingStoryDemo() {
  return (
    <section
      className="mkt-section mkt-section--demo mkt-wave-bottom mkt-wave-overlap"
      id="demo"
      aria-labelledby="mkt-demo-title"
    >
      <div className="mkt-container">
        <div className="mkt-section__head">
          <p className="mkt-eyebrow mkt-eyebrow--pill">Live example</p>
          <h2 className="mkt-h2" id="mkt-demo-title">
            One thread. Six ways to read it.
          </h2>
          <p className="mkt-lede">
            Forward messy replies, then open your story. Try the toolbar — switch
            between three themes and day or night mode to find the look you like.
          </p>
        </div>

        <div className="mkt-demo">
          <div className="mkt-demo__panel mkt-demo__panel--thread">
            <div className="mkt-demo__panel-head">
              <span className="mkt-demo__panel-label">Forwarded thread</span>
              <span className="mkt-demo__panel-note">5 messages · messy by design</span>
            </div>
            <div className="mkt-demo-thread">
              <div className="mkt-demo-thread__chrome">
                <span />
                <span />
                <span />
              </div>
              <div className="mkt-demo-thread__toolbar">
                <span className="mkt-demo-thread__folder">Inbox</span>
                <span className="mkt-demo-thread__count">5</span>
              </div>
              <div className="mkt-demo-thread__subject-bar">
                <span className="mkt-demo-thread__subject-label">Subject</span>
                <strong>{MARKETING_SAMPLE_SUBJECT}</strong>
              </div>
              <div className="mkt-demo-thread__messages">
                {MARKETING_SAMPLE_THREAD.map((message) => (
                  <DemoThreadMessage key={message.index} message={message} />
                ))}
              </div>
            </div>
          </div>

          <div className="mkt-demo__bridge" aria-hidden="true">
            <span className="mkt-demo__bridge-icon">→</span>
            <span className="mkt-demo__bridge-copy">Your story</span>
          </div>

          <div className="mkt-demo__panel mkt-demo__panel--story">
            <div className="mkt-demo__panel-head">
              <span className="mkt-demo__panel-label">Generated story preview</span>
              <span className="mkt-demo__panel-note">Try theme &amp; day/night</span>
            </div>
            <MarketingInteractiveStoryPreview digest={MARKETING_SAMPLE_DIGEST} />
          </div>
        </div>
      </div>
    </section>
  );
}
