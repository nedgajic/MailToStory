import Link from "next/link";
import { PricingCards } from "@/components/landing/pricing-cards";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingHeroCta } from "@/components/landing/marketing-auth-cta";
import { MarketingFaq } from "@/components/landing/marketing-faq";
import { MarketingHomeFooter } from "@/components/landing/marketing-home-footer";
import { BRAND_NAME, BRAND_PRIVACY_URL } from "@/lib/brand";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";
import "@/app/marketing-home.css";

const features = [
  {
    title: "Story view",
    description:
      "Long threads become clear narrative prose — who said what, in order, without signature noise or nested quotes.",
    tag: "Read",
    accent: "see",
  },
  {
    title: "Timeline",
    description:
      "See every turn at a glance with dates, speakers, and jumps back to the original message.",
    tag: "Trace",
    accent: "speak",
  },
  {
    title: "Open actions",
    description:
      "Decisions, deadlines, and follow-ups surface in a dedicated list so nothing hides in paragraph twelve.",
    tag: "Act",
    accent: "connect",
  },
  {
    title: "Export anywhere",
    description:
      "Copy as Markdown, download PDF or Word, and share a polished summary with your team in seconds.",
    tag: "Share",
    accent: "see",
  },
];

const steps = [
  {
    num: "01",
    title: "Create an account",
    body: "Sign up with any email, or Google. We never request access to your inbox.",
  },
  {
    num: "02",
    title: "Forward a thread",
    body: "Send it to your private MailToStory address from Gmail, Outlook, or Apple Mail.",
  },
  {
    num: "03",
    title: "Read the story",
    body: "Open your dashboard for the recap, timeline, actions, and exports.",
  },
];

export function LandingPage() {
  const google = googleAuthEnabled();

  return (
    <div className="mkt">
      <MarketingHeader />

      <main>
        <section className="mkt-hero" id="home">
          <div className="mkt-hero__bg" aria-hidden="true">
            <div className="mkt-hero__mesh" />
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

        <section className="mkt-section mkt-section--features" id="features">
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
                  <span className="mkt-feature-card__tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mkt-section mkt-section--steps" id="how-it-works">
          <div className="mkt-container mkt-section__split">
            <div className="mkt-section__head mkt-section__head--left">
              <p className="mkt-eyebrow mkt-eyebrow--pill">How it works</p>
              <h2 className="mkt-h2">Three steps to your first story</h2>
              <p className="mkt-lede">
                No OAuth scopes, no inbox sync — just forward and read.
              </p>
            </div>
            <ol className="mkt-steps">
              {steps.map((step) => (
                <li key={step.num} className="mkt-step">
                  <span className="mkt-step__num">{step.num}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mkt-section mkt-section--pricing" id="pricing">
          <div className="mkt-container">
            <div className="mkt-section__head mkt-section__head--light">
              <p className="mkt-eyebrow mkt-eyebrow--light">Pricing</p>
              <h2 className="mkt-h2 mkt-h2--light">Simple plans</h2>
              <p className="mkt-lede mkt-lede--light">
                Start free. Upgrade when you need unlimited stories or team seats.
              </p>
            </div>
            <PricingCards variant="dark" />
          </div>
        </section>

        <section className="mkt-section mkt-section--faq" id="faq">
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

        <section className="mkt-section mkt-section--cta">
          <div className="mkt-container">
            <div className="mkt-cta-band">
              <h2 className="mkt-h2">Ready for a calmer inbox?</h2>
              <p className="mkt-lede">
                Create your account, copy your private address, and forward your first
                thread today.
              </p>
              <Link href="/signup" className="mkt-btn mkt-btn--hero mkt-btn--lg">
                Get started free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingHomeFooter privacyUrl={BRAND_PRIVACY_URL} />
    </div>
  );
}
