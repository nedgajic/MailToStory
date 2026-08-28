import { PricingCards } from "@/components/landing/pricing-cards";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingHeroCta } from "@/components/landing/marketing-auth-cta";
import { MarketingFaq } from "@/components/landing/marketing-faq";
import { MarketingHomeFooter } from "@/components/landing/marketing-home-footer";
import { AuthModalTrigger } from "@/components/auth/auth-modal-trigger";
import { BRAND_NAME, BRAND_PRIVACY_PATH } from "@/lib/brand";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";
import "@/app/marketing-home.css";

const features = [
  {
    title: "Story view",
    description:
      "Long threads become clear narrative prose — who said what, in order, without signature noise or nested quotes.",
    tag: "Read",
    accent: "see",
    glyph: "◈",
  },
  {
    title: "Timeline",
    description:
      "See every turn at a glance with dates, speakers, and jumps back to the original message.",
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
      "Copy as Markdown, download PDF or Word, and share a polished summary with your team in seconds.",
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
    title: "Read the story",
    body: "Open your dashboard for the recap, timeline, open actions, and exports.",
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
          <div className="mkt-hero__bg" aria-hidden="true">
            <div className="mkt-hero__mesh" />
            <div className="mkt-hero__orb mkt-hero__orb--1" />
            <div className="mkt-hero__orb mkt-hero__orb--2" />
            <div className="mkt-hero__orb mkt-hero__orb--3" />
            <div className="mkt-hero__grain" />
          </div>
          <div className="mkt-container mkt-hero__inner">
            <div className="mkt-hero__copy">
              <div className="mkt-badge">
                <span className="mkt-badge__dot" aria-hidden />
                Forward it · Read the story
              </div>
              <h1 className="mkt-hero__title">
                Turn long email threads into{" "}
                <span className="mkt-hero__title-accent">calm, structured reading</span>
              </h1>
              <p className="mkt-lede mkt-hero__lead">
                {BRAND_NAME} gives you a private address. Forward any thread and get a
                clear story, timeline, and list of open actions — without connecting
                to your inbox.
              </p>
              <MarketingHeroCta googleEnabled={google} />
              <p className="mkt-hero__note">
                We never connect to your inbox · You choose what to forward
              </p>
              <ul className="mkt-trust-strip" aria-label="Product highlights">
                <li>No inbox OAuth</li>
                <li>Private forwarding address</li>
                <li>PDF & Markdown export</li>
              </ul>
            </div>

            <div className="mkt-hero__preview" aria-hidden="true">
              <div className="mkt-preview-card">
                <div className="mkt-preview-card__chrome">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mkt-preview-card__body">
                  <p className="mkt-preview-card__kicker">Thread story</p>
                  <h3>Vendor negotiation — Q3 terms</h3>
                  <p className="mkt-preview-card__status">Resolved · 4 participants</p>
                  <ul>
                    <li>Ada agreed to net-30 starting October</li>
                    <li>Legal review scheduled for the revised MSA</li>
                    <li>Finance to confirm updated pricing by Friday</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section--features mkt-wave-bottom mkt-wave-overlap" id="features">
          <div className="mkt-container">
            <div className="mkt-section__head">
              <p className="mkt-eyebrow mkt-eyebrow--pill">What you get</p>
              <h2 className="mkt-h2">Everything you need to understand a thread</h2>
              <p className="mkt-lede">
                One forward becomes a readable recap you can scan, share, and act on.
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
              <h2 className="mkt-h2">Ready for a calmer inbox?</h2>
              <p className="mkt-lede">
                Create your account, copy your private address, and forward your first
                thread today.
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
