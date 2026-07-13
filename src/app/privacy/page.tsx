import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import {
  BRAND_NAME,
  BRAND_PRIVACY_URL,
  BRAND_SUPPORT_EMAIL,
  BRAND_TERMS_URL,
  BRAND_URL,
} from "@/lib/brand";

const EFFECTIVE_DATE = "July 13, 2026";

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `How ${BRAND_NAME} accesses, uses, stores, and shares Google user data.`,
  alternates: { canonical: BRAND_PRIVACY_URL },
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
        <p>
          This Privacy Policy describes how {BRAND_NAME} (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and
          shares information when you use our web application at{" "}
          <a href={BRAND_URL}>{BRAND_URL}</a> (the &quot;Service&quot;).
        </p>
        <p>
          By signing in with Google and using the Service, you agree to this
          Privacy Policy. If you do not agree, please do not use the Service.
        </p>

        <h2>1. Who we are</h2>
        <p>
          {BRAND_NAME} is operated by the developer identified on the Google
          OAuth consent screen. For privacy questions or requests, contact us at{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
        </p>
        <p>
          {BRAND_NAME} is not affiliated with, endorsed by, or sponsored by
          Google LLC.
        </p>

        <h2>2. What the Service does</h2>
        <p>
          {BRAND_NAME} connects to your Gmail account (read-only) so you can
          browse email threads and generate structured summaries—story
          narratives, timelines, and action lists—from conversations you
          choose to open. You can export summaries as Markdown, PDF, or Word.
        </p>

        <h2>3. Google user data we access</h2>
        <p>
          When you sign in with Google, we request the following OAuth scopes:
        </p>
        <ul>
          <li>
            <strong>openid, email, and profile</strong> — to identify your
            account, display your name and profile image, and maintain your
            session.
          </li>
          <li>
            <strong>https://www.googleapis.com/auth/gmail.readonly</strong> —
            to list threads in your Gmail inbox and read message content for
            threads you open, solely so we can generate summaries and show
            previews. We do not send email, modify labels, or delete messages.
          </li>
        </ul>
        <p>
          We access Gmail data only after you sign in and only when you use
          features that require it (for example, loading your inbox or opening
          a thread).
        </p>

        <h2>4. How we use Google user data</h2>
        <p>We use Google user data only to provide and improve the Service:</p>
        <ul>
          <li>Authenticate you and keep you signed in.</li>
          <li>
            Fetch Gmail threads and messages you choose to view or summarize.
          </li>
          <li>
            Generate AI-assisted story summaries, timelines, and action lists
            from thread content.
          </li>
          <li>
            Let you export summaries and link back to original Gmail messages.
          </li>
          <li>Diagnose errors and protect the security of the Service.</li>
        </ul>
        <p>We do <strong>not</strong> use Google user data to:</p>
        <ul>
          <li>Serve advertisements or sell your data.</li>
          <li>Build profiles for unrelated products.</li>
          <li>Train general-purpose machine-learning models on your emails.</li>
          <li>Allow humans to read your email content except as described below.</li>
        </ul>

        <h2>5. Google API Services User Data Policy (Limited Use)</h2>
        <p>
          {BRAND_NAME}&apos;s use and transfer of information received from
          Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. In particular:
        </p>
        <ul>
          <li>
            We use Google user data only to provide user-facing features that
            are prominent in the Service and not for any other purpose.
          </li>
          <li>
            We do not transfer Google user data to third parties except as
            necessary to operate the Service (see Section 6), for legal
            compliance, or with your explicit consent.
          </li>
          <li>
            We do not use Google user data for serving ads, including
            retargeting or personalized advertising.
          </li>
          <li>
            We do not allow humans to read your Gmail content except: (a) with
            your affirmative agreement for a specific message or support
            request, (b) when necessary for security purposes (such as
            investigating abuse), or (c) when required to comply with
            applicable law.
          </li>
        </ul>

        <h2>6. Third-party services and data sharing</h2>
        <p>
          To operate the Service, limited data may be processed by infrastructure
          and API providers under our control:
        </p>
        <ul>
          <li>
            <strong>Google Gmail API</strong> — source of thread and message
            data you request.
          </li>
          <li>
            <strong>Google Gemini API</strong> — when you generate a story for a
            thread, relevant thread text is sent to Google&apos;s generative AI
            service to produce the summary. We do not send your data to Gemini
            except for this on-demand summarization you initiate.
          </li>
          <li>
            <strong>Hosting and database</strong> — account, session, and cached
            summary data are stored on servers we operate.
          </li>
        </ul>
        <p>
          We do not sell, rent, or trade your personal information or Google
          user data. We may disclose information if required by law or to protect
          the rights, safety, and security of users and the Service.
        </p>

        <h2>7. What we store</h2>
        <p>We store only what is needed to run the Service:</p>
        <ul>
          <li>
            <strong>Account and session data</strong> — your Google account
            identifier, name, email address, profile image URL, OAuth tokens
            (including refresh tokens for Gmail read access), and session
            records managed by NextAuth.
          </li>
          <li>
            <strong>Cached story summaries</strong> — for threads you have
            summarized, we may store the generated story JSON (title, narrative,
            timeline, and actions) and Gmail message IDs so we can show results
            faster on repeat visits. We do not store raw Gmail message bodies in
            our database; message content is fetched from Gmail when needed.
          </li>
          <li>
            <strong>Server logs</strong> — standard technical logs (timestamps,
            error messages, request metadata) for reliability and security.
            These logs are not used to read your email content.
          </li>
        </ul>

        <h2>8. Data retention and deletion</h2>
        <ul>
          <li>
            OAuth tokens and account records remain while your account is active.
          </li>
          <li>
            Cached story summaries remain until you delete your account, we
            delete them, or they are no longer needed to provide the Service.
          </li>
          <li>
            You can revoke {BRAND_NAME}&apos;s access anytime in your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Account permissions
            </a>
            . After revocation, we can no longer access your Gmail data.
          </li>
          <li>
            You can sign out of {BRAND_NAME} at any time. To request deletion of
            stored account data, email{" "}
            <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
          </li>
        </ul>

        <h2>9. Security</h2>
        <p>
          We use HTTPS for all production traffic, restrict database and server
          access, and store secrets in environment configuration. No method of
          transmission or storage is 100% secure; we work to protect your data
          using reasonable industry practices.
        </p>

        <h2>10. Your choices and rights</h2>
        <p>Depending on where you live, you may have rights to access, correct,
          or delete personal data we hold. Contact{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a> to
          make a request. We will respond within a reasonable time.
        </p>

        <h2>11. Children</h2>
        <p>
          The Service is not directed at children under 13 (or the minimum age
          required in your jurisdiction). We do not knowingly collect data from
          children.
        </p>

        <h2>12. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the
          revised version at this URL and update the effective date above.
          Continued use of the Service after changes means you accept the updated
          policy.
        </p>

        <h2>13. Related documents</h2>
        <p>
          See also our <a href={BRAND_TERMS_URL}>Terms of Service</a>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
