import Image from "next/image";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { BRAND_ICON_PATH, BRAND_NAME, BRAND_PRIVACY_URL } from "@/lib/brand";

const features = [
  {
    title: "Story view",
    description:
      "Long threads become clear narrative prose—who said what, in order, without the noise of signatures and quoted replies.",
    tag: "Read",
  },
  {
    title: "Timeline",
    description:
      "See every turn at a glance with dates, speakers, and one-click jumps back to the original Gmail message.",
    tag: "Trace",
  },
  {
    title: "Open actions",
    description:
      "Decisions, deadlines, and follow-ups surface in a dedicated list so nothing important hides in paragraph twelve.",
    tag: "Act",
  },
  {
    title: "Export anywhere",
    description:
      "Copy as Markdown, download PDF or Word, and share a polished summary with your team in seconds.",
    tag: "Share",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect Gmail",
    body: "Sign in with Google. We request read-only access—your inbox stays yours.",
  },
  {
    num: "02",
    title: "Pick a thread",
    body: "Browse your Primary inbox, filter by conversation length, and open any thread worth reading.",
  },
  {
    num: "03",
    title: "Read the story",
    body: "Get a structured recap in seconds: story, timeline, actions, and links to every source message.",
  },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export function LandingPage() {
  return (
    <div className="home">
      <div className="home-bg" aria-hidden="true">
        <div className="home-bg__mesh" />
        <div className="home-bg__grain" />
      </div>

      <header className="home-nav">
        <div className="home-nav__inner home-nav__inner--actions-only">
          <GoogleSignInButton className="home-nav__signin">
            Sign in
          </GoogleSignInButton>
        </div>
      </header>

      <main>
        <div className="home-brand">
          <div className="home-brand__inner">
            <Link href="/" className="home-logo home-logo--prominent">
              <Image
                src={BRAND_ICON_PATH}
                alt=""
                width={96}
                height={96}
                className="home-logo__mark"
                priority
              />
              <span className="home-logo__text">{BRAND_NAME}</span>
            </Link>
          </div>
        </div>

        <section className="home-hero">
          <div className="home-hero__inner">
            <div className="home-hero__copy">
              <p className="home-kicker">Your inbox, rewritten for humans</p>
              <h1 className="home-hero__title">
                Turn long email threads into calm, structured reading
              </h1>
              <p className="home-hero__lead">
                {BRAND_NAME} transforms noisy conversations into a clear story,
                a chronological timeline, and a list of open actions—so you can
                catch up in minutes, not half an hour.
              </p>
              <div className="home-hero__actions">
                <GoogleSignInButton className="home-cta home-cta--primary">
                  <GoogleIcon />
                  Continue with Google
                </GoogleSignInButton>
                <p className="home-hero__note">
                  Read-only Gmail access · No email bodies stored
                </p>
              </div>
              <ul className="home-trust" aria-label="Product highlights">
                <li>Story, timeline &amp; actions</li>
                <li>Markdown, PDF &amp; Word export</li>
                <li>Jump to source messages</li>
              </ul>
            </div>

            <div className="home-preview" aria-hidden="true">
              <div className="home-preview__chrome">
                <div className="home-preview__dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="home-preview__label">Story preview</span>
              </div>
              <div className="home-preview__body">
                <div className="home-preview__recap">
                  <p className="home-preview__recap-kicker">Recap</p>
                  <p className="home-preview__recap-text">
                    The team agreed to ship the API by Friday. Legal needs one
                    more revision on the contract clause before sign-off.
                  </p>
                  <span className="home-preview__pill home-preview__pill--amber">
                    Action needed
                  </span>
                </div>
                <div className="home-preview__tabs">
                  <span className="home-preview__tab home-preview__tab--active">
                    Story
                  </span>
                  <span className="home-preview__tab">Timeline</span>
                  <span className="home-preview__tab">Actions</span>
                </div>
                <div className="home-preview__story">
                  <div className="home-preview__turn home-preview__turn--a">
                    <p>
                      <strong>Sarah</strong> opened the thread with the revised
                      timeline and asked whether engineering could commit to the
                      March release window.
                    </p>
                  </div>
                  <div className="home-preview__turn home-preview__turn--b">
                    <p>
                      <strong>James</strong> confirmed capacity on the backend
                      squad and flagged the dependency on legal review.
                    </p>
                  </div>
                  <div className="home-preview__turn home-preview__turn--c">
                    <p>
                      <strong>Legal</strong> returned redlines on section 4.2;
                      the group is waiting on a final counter before signing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-section--features">
          <div className="home-section__inner">
            <div className="home-section__head">
              <p className="home-kicker">What you get</p>
              <h2 className="home-section__title">
                Everything you need to understand a thread—nothing you don&apos;t
              </h2>
            </div>
            <ul className="home-features">
              {features.map((feature) => (
                <li key={feature.title} className="home-feature">
                  <span className="home-feature__tag">{feature.tag}</span>
                  <h3 className="home-feature__title">{feature.title}</h3>
                  <p className="home-feature__body">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="home-section home-section--steps">
          <div className="home-section__inner home-section__inner--split">
            <div className="home-section__head">
              <p className="home-kicker">How it works</p>
              <h2 className="home-section__title">
                From inbox overload to clarity in three steps
              </h2>
              <p className="home-section__lead">
                No new habits to learn. Open a thread you already care about and
                let the story do the heavy lifting.
              </p>
            </div>
            <ol className="home-steps">
              {steps.map((step, index) => (
                <li
                  key={step.num}
                  className={`home-step home-step--${index}`}
                >
                  <span className="home-step__num">{step.num}</span>
                  <div className="home-step__content">
                    <h3 className="home-step__title">{step.title}</h3>
                    <p className="home-step__body">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-section home-section--privacy">
          <div className="home-section__inner">
            <div className="home-privacy">
              <div>
                <p className="home-kicker">Built for trust</p>
                <h2 className="home-section__title home-section__title--compact">
                  Your mail stays private
                </h2>
                <p className="home-section__lead">
                  Stories are generated on demand. We don&apos;t store raw Gmail
                  message bodies in our database—we cache generated summaries and
                  the OAuth tokens needed to connect your account.{" "}
                  <Link href={BRAND_PRIVACY_URL} className="home-inline-link">
                    Privacy Policy
                  </Link>
                </p>
              </div>
              <ul className="home-privacy__list">
                <li>
                  <strong>Read-only</strong>
                  <span>We never send mail on your behalf</span>
                </li>
                <li>
                  <strong>On demand</strong>
                  <span>Stories generated when you open a thread</span>
                </li>
                <li>
                  <strong>Your account</strong>
                  <span>Sign out anytime; revoke access in Google settings</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="home-cta-band">
          <div className="home-cta-band__inner">
            <h2 className="home-cta-band__title">
              Ready to read your next thread differently?
            </h2>
            <p className="home-cta-band__lead">
              Connect Gmail and open any conversation—you&apos;ll wonder how you
              ever read it the old way.
            </p>
            <GoogleSignInButton className="home-cta home-cta--primary home-cta--large">
              <GoogleIcon />
              Get started with Google
            </GoogleSignInButton>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
