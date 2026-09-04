import { MarketingStoryDemo } from "@/components/landing/marketing-story-demo";
import { MarketingHeroBackground } from "@/components/landing/marketing-hero-background";
import { PricingCards } from "@/components/landing/pricing-cards";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingHeroCta } from "@/components/landing/marketing-auth-cta";
import { MarketingFaq } from "@/components/landing/marketing-faq";
import { MarketingHomeFooter } from "@/components/landing/marketing-home-footer";
import { AuthModalTrigger } from "@/components/auth/auth-modal-trigger";
import { BRAND_PRIVACY_PATH } from "@/lib/brand";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";
import "@/app/marketing-home.css";

const features = [
  {
    title: "Story view",
    description:
      "Nested quotes and signatures disappear. What remains reads like a short article you can follow — and actually enjoy.",
    tag: "Enjoy",
    accent: "see",
    glyph: "◈",
  },
  {
    title: "Timeline",
    description:
      "See every turn at a glance when you want the facts fast — dates, speakers, and one-click jumps to the original.",
    tag: "Trace",
    accent: "speak",
    glyph: "◎",
  },
  {
    title: "Open actions",
    description:
      "Decisions, deadlines, and follow-ups surface in a dedicated list so nothing hides in paragraph twelve.",
    tag: "Act",
    accent: "connect",
    glyph: "◆",
  },
  {
    title: "Export anywhere",
    description:
      "Copy as Markdown, download PDF or Word, and share a polished summary your team will want to read.",
    tag: "Share",
    accent: "see",
    glyph: "↗",
  },
];

const steps = [
  {
    num: "01",
    title: "Create an account",
    body: "Sign up with any email, or Google. We never request access to your inbox.",
    tone: "violet",
    scene: "signup",
  },
  {
    num: "02",
    title: "Forward a thread",
    body: "Send it to your private address from whatever mail app or provider you use.",
    tone: "mint",
    scene: "forward",
  },
  {
    num: "03",
    title: "Enjoy the story",
    body: "Open a flowing recap — story, timeline, and open actions — instead of scrolling through reply hell.",
    tone: "peach",
    scene: "story",
  },
] as const;

function StepScene({ scene }: { scene: (typeof steps)[number]["scene"] }) {
  if (scene === "signup") {
    return (
      <div className="mkt-step-scene mkt-step-scene--signup" aria-hidden="true">
        <span className="mkt-step-scene__form">
          <span className="mkt-step-scene__field" />
          <span className="mkt-step-scene__field mkt-step-scene__field--short" />
          <span className="mkt-step-scene__join">Join</span>
        </span>
      </div>
    );
  }

  if (scene === "forward") {
    return (
      <div className="mkt-step-scene mkt-step-scene--forward" aria-hidden="true">
        <span className="mkt-step-scene__composer">
          <span className="mkt-step-scene__composer-dot" />
          <span className="mkt-step-scene__composer-dot" />
          <span className="mkt-step-scene__composer-dot" />
          <span className="mkt-step-scene__to">To: you@…</span>
          <span className="mkt-step-scene__thread" />
          <span className="mkt-step-scene__thread mkt-step-scene__thread--short" />
        </span>
        <span className="mkt-step-scene__send">Send</span>
      </div>
    );
  }

  return (
    <div className="mkt-step-scene mkt-step-scene--story" aria-hidden="true">
      <span className="mkt-step-scene__spark mkt-step-scene__spark--1">✦</span>
      <span className="mkt-step-scene__spark mkt-step-scene__spark--2">✦</span>
      <span className="mkt-step-scene__page">
        <span className="mkt-step-scene__line mkt-step-scene__line--1" />
        <span className="mkt-step-scene__line mkt-step-scene__line--2" />
        <span className="mkt-step-scene__line mkt-step-scene__line--3" />
        <span className="mkt-step-scene__line mkt-step-scene__line--4" />
      </span>
    </div>
  );
}

export function LandingPage() {
  const google = googleAuthEnabled();

  return (
    <div className="mkt">
      <MarketingHeader />

      <main>
        <section className="mkt-hero mkt-wave-bottom" id="home">
          <MarketingHeroBackground />
          <div className="mkt-container mkt-hero__inner">
            <div className="mkt-hero__copy">
              <div className="mkt-badge">
                <span className="mkt-badge__dot" aria-hidden />
                Finally — threads you&apos;ll want to read
              </div>
              <h1 className="mkt-hero__title">
                Long email threads,{" "}
                <span className="mkt-hero__title-accent">rewritten as stories you&apos;ll enjoy</span>
              </h1>
              <p className="mkt-lede mkt-hero__lead">
                Stop dreading the scroll. Forward any thread to your private address and
                get a clear, flowing narrative — who said what, in order — plus a timeline
                and open actions. Reading long mail becomes surprisingly pleasant.
              </p>
              <MarketingHeroCta googleEnabled={google} />
              <p className="mkt-hero__note">
                We never connect to your inbox · You choose what to forward
              </p>
              <ul className="mkt-trust-strip" aria-label="Product highlights">
                <li>Reads like a story, not a stack of replies</li>
                <li>Private forwarding address</li>
                <li>No inbox OAuth required</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section--features mkt-wave-bottom mkt-wave-overlap" id="features">
          <div className="mkt-container">
            <div className="mkt-section__head">
              <p className="mkt-eyebrow mkt-eyebrow--pill">What you get</p>
              <h2 className="mkt-h2">A better way through every long thread</h2>
              <p className="mkt-lede">
                One forward becomes a recap you can skim, savor, share, and act on —
                without wading through nested quotes and signatures.
              </p>
            </div>
            <ul className="mkt-feature-grid">
              {features.map((feature) => (
                <li
                  key={feature.title}
                  className={`mkt-feature-card mkt-feature-card--${feature.accent}`}
                >
                  <span className="mkt-feature-card__glyph" aria-hidden="true">
                    {feature.glyph}
                  </span>
                  <span className="mkt-feature-card__tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <MarketingStoryDemo />

        <section className="mkt-section mkt-section--steps mkt-wave-bottom mkt-wave-overlap" id="how-it-works">
          <div className="mkt-container">
            <div className="mkt-section__head">
              <p className="mkt-eyebrow mkt-eyebrow--pill">How it works</p>
              <h2 className="mkt-h2">Three steps to your first story</h2>
              <p className="mkt-lede">
                No OAuth scopes, no inbox sync — just forward and read.
              </p>
            </div>
            <ol className="mkt-steps mkt-steps--cards">
              {steps.map((step) => (
                <li
                  key={step.num}
                  className={`mkt-step-card mkt-step-card--${step.tone}`}
                >
                  <span className="mkt-step-card__num">{step.num}</span>
                  <StepScene scene={step.scene} />
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mkt-section mkt-section--pricing mkt-wave-bottom mkt-wave-overlap" id="pricing">
          <div className="mkt-container">
            <div className="mkt-section__head mkt-section__head--light">
              <p className="mkt-eyebrow mkt-eyebrow--light">Pricing</p>
              <h2 className="mkt-h2 mkt-h2--light">Simple plans</h2>
              <p className="mkt-lede mkt-lede--light">
                Start free. Upgrade when you need more stories per month or team seats.
              </p>
            </div>
            <PricingCards variant="dark" />
          </div>
        </section>

        <section className="mkt-section mkt-section--faq mkt-wave-bottom mkt-wave-overlap" id="faq">
          <div className="mkt-container mkt-container--narrow">
            <div className="mkt-section__head">
              <p className="mkt-eyebrow mkt-eyebrow--pill">FAQ</p>
              <h2 className="mkt-h2">Common questions</h2>
              <p className="mkt-lede">
                Privacy-first by design. Only mail you forward is processed.
              </p>
            </div>
            <MarketingFaq />
          </div>
        </section>

        <section className="mkt-section mkt-section--cta mkt-wave-bottom mkt-wave-overlap">
          <div className="mkt-container">
            <div className="mkt-cta-band">
              <h2 className="mkt-h2">Ready to enjoy your next thread?</h2>
              <p className="mkt-lede">
                Create your account, copy your private address, and forward the thread
                you&apos;ve been putting off. You might actually look forward to reading it.
              </p>
              <AuthModalTrigger mode="signup" className="mkt-btn mkt-btn--hero mkt-btn--lg">
                Get started free
              </AuthModalTrigger>
            </div>
          </div>
        </section>
      </main>

      <MarketingHomeFooter privacyUrl={BRAND_PRIVACY_PATH} />
    </div>
  );
}
