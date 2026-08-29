"use client";

import { useState } from "react";
import type { Digest } from "@/lib/digest-schema";
import { flattenNarrativeForStory } from "@/lib/flattenNarrativeForStory";
import {
  MARKETING_SAMPLE_DIGEST,
  MARKETING_SAMPLE_SUBJECT,
  MARKETING_SAMPLE_THREAD,
  type MarketingThreadMessage,
} from "@/lib/marketing-sample-thread";
import { BRAND_NAME } from "@/lib/brand";
import "@/app/marketing-demo.css";

type DemoTab = "story" | "timeline" | "actions";

const TABS: { id: DemoTab; label: string }[] = [
  { id: "story", label: "Story" },
  { id: "timeline", label: "Timeline" },
  { id: "actions", label: "Actions" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusConfig(status: Digest["status"]) {
  const map = {
    resolved: { label: "Resolved", color: "#2d6a4f", bg: "#d8f3dc" },
    ongoing: { label: "Ongoing", color: "#7b4f12", bg: "#fde8c8" },
    pending_action: { label: "Pending Action", color: "#1d3557", bg: "#d6e8f7" },
    no_conclusion: {
      label: "No Conclusion",
      color: "var(--digest-prose-soft)",
      bg: "#eee",
    },
  };
  return map[status] ?? map.no_conclusion;
}

function speakerHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 33 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 5;
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

function DemoStoryTurn({
  speaker,
  content,
  attachments = [],
}: {
  speaker?: string;
  content: string;
  attachments?: Array<{ filename: string; context: string }>;
}) {
  const idx = speaker ? speakerHue(speaker) : 0;
  const panelStyle = speaker
    ? {
        background: `var(--digest-speaker-${idx}-bg)`,
        borderLeft: `3px solid var(--digest-speaker-${idx}-accent)`,
      }
    : undefined;

  return (
    <div className="digest-story-turn-root mkt-demo-story-turn">
      <div className="digest-story-turn__prose">
        {speaker ? (
          <div className="mkt-demo-story-turn__panel" style={panelStyle}>
            <div className="mkt-demo-story-turn__speaker">
              <DemoSpeakerAvatar name={speaker} />
              <span>{speaker}</span>
            </div>
            {content ? <p>{content}</p> : null}
          </div>
        ) : content ? (
          <p>{content}</p>
        ) : null}
      </div>
      {attachments.length > 0 ? (
        <aside className="digest-story-turn__meta" aria-label="Attachments">
          <div className="digest-story-meta-strip">
            <div className="digest-story-meta-strip__resources">
              <div className="digest-paragraph-resources">
                <div className="digest-paragraph-resources-label">Files</div>
                <div className="digest-attachment-strip-stack">
                  {attachments.map((file) => (
                    <div key={file.filename} className="digest-attachment-strip">
                      <span className="digest-attachment-strip-icon" aria-hidden="true">
                        📎
                      </span>
                      <div className="digest-attachment-strip-body">
                        <div className="digest-attachment-strip-name">{file.filename}</div>
                        <p className="digest-attachment-strip-context">{file.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      ) : (
        <div
          className="digest-story-turn__meta digest-story-turn__meta--empty"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function DemoDigestPanel({
  digest,
  activeTab,
}: {
  digest: Digest;
  activeTab: DemoTab;
}) {
  const status = statusConfig(digest.status);
  const storyItems = flattenNarrativeForStory(digest.narrative);
  const firstTimeline = digest.timeline[0];
  const lastTimeline = digest.timeline[digest.timeline.length - 1];

  return (
    <div className="mkt-demo-digest__body digest-wrap">
      <div className="mkt-demo-digest__header">
        <p className="mkt-demo-digest__kicker">Thread story</p>
        <h3 className="mkt-demo-digest__title">{digest.title}</h3>
        <p className="mkt-demo-digest__meta">
          {digest.participants.length} participants · {digest.timeline.length} timeline
          beats
          {firstTimeline && lastTimeline
            ? ` · ${formatDateShort(firstTimeline.date)} – ${formatDateShort(lastTimeline.date)}`
            : ""}
        </p>
      </div>

      <div className="digest-recap-align mkt-demo-digest__recap">
        <div className="digest-recap-align__main">
          <div className="digest-recap-panel">
            <div className="digest-recap-meta-row">
              <span className="digest-recap-kicker">Recap</span>
              <span
                className="digest-recap-status-pill"
                style={{ color: status.color, background: status.bg }}
              >
                {status.label}
              </span>
            </div>
            <p className="digest-recap-summary">{digest.resolution_summary}</p>
          </div>
        </div>
        <div className="digest-recap-align__rail" aria-hidden="true" />
      </div>

      <div
        id="mkt-demo-panel-story"
        role="tabpanel"
        className="digest-tab-panel digest-panel-story digest-panel-story--grid"
        hidden={activeTab !== "story"}
      >
        {storyItems.map((item) => {
          if (item.kind === "attachment_only") {
            return (
              <DemoStoryTurn
                key={`att-${item.sourceIndex}`}
                speaker={item.block.speaker}
                content=""
                attachments={[
                  { filename: item.block.filename, context: item.block.context },
                ]}
              />
            );
          }

          return (
            <DemoStoryTurn
              key={`prose-${item.sourceIndex}`}
              speaker={item.block.speaker}
              content={item.block.content}
              attachments={item.attachments.map((att) => ({
                filename: att.filename,
                context: att.context,
              }))}
            />
          );
        })}
      </div>

      <div
        id="mkt-demo-panel-timeline"
        role="tabpanel"
        className="digest-tab-panel"
        hidden={activeTab !== "timeline"}
      >
        <p className="mkt-demo-section-label">Thread timeline</p>
        <div className="mkt-demo-timeline">
          {digest.timeline.map((event, i) => (
            <div key={`${event.date}-${i}`} className="mkt-demo-timeline__item">
              <span
                className={
                  i === digest.timeline.length - 1
                    ? "mkt-demo-timeline__dot mkt-demo-timeline__dot--active"
                    : "mkt-demo-timeline__dot"
                }
                aria-hidden="true"
              />
              <div>
                <div className="mkt-demo-timeline__meta">
                  <span>{formatDateShort(event.date)}</span>
                  <span className="mkt-demo-timeline__actor">
                    <DemoSpeakerAvatar name={event.actor} />
                    {event.actor}
                  </span>
                </div>
                <p className="mkt-demo-timeline__summary">{event.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="mkt-demo-panel-actions"
        role="tabpanel"
        className="digest-tab-panel digest-tab-panel--actions"
        hidden={activeTab !== "actions"}
      >
        <p className="mkt-demo-section-label">Action items</p>
        <div className="mkt-demo-actions">
          {digest.action_items.map((item, i) => (
            <div key={`${item.action}-${i}`} className="mkt-demo-action">
              <span className="mkt-demo-action__check" aria-hidden="true" />
              <div>
                <p className="mkt-demo-action__text">{item.action}</p>
                <div className="mkt-demo-action__meta">
                  {item.owner ? <span>→ {item.owner}</span> : null}
                  {item.due ? <span>Due {formatDue(item.due)}</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mkt-demo-section-label">Participants</p>
        <div className="mkt-demo-participants">
          {digest.participants.map((person) => (
            <div key={person.email} className="mkt-demo-participant">
              <DemoSpeakerAvatar name={person.name} />
              <div>
                <strong>{person.name}</strong>
                <span>{person.role}</span>
                <span className="mkt-demo-participant__email">{person.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MarketingStoryDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>("story");

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
            Five replies in. One story out.
          </h2>
          <p className="mkt-lede">
            A realistic thread with budget, legal, and engineering voices — then the
            structured recap {BRAND_NAME} produces: narrative, timeline, and open
            actions.
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
            <span className="mkt-demo__bridge-copy">Generated story</span>
          </div>

          <div className="mkt-demo__panel mkt-demo__panel--story">
            <div className="mkt-demo__panel-head">
              <span className="mkt-demo__panel-label">Your dashboard</span>
              <span className="mkt-demo__panel-note">Story · Timeline · Actions</span>
            </div>
            <div className="mkt-demo-digest">
              <div className="mkt-demo-digest__tabs">
                <div className="digest-tab-strip" role="tablist" aria-label="Story sections">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      id={`mkt-demo-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`mkt-demo-panel-${tab.id}`}
                      className={`digest-tab-btn ${activeTab === tab.id ? "digest-tab-btn-active" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="digest-tab-text">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <DemoDigestPanel digest={MARKETING_SAMPLE_DIGEST} activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
