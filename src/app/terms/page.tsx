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
  title: `Terms of Service — ${BRAND_NAME}`,
  description: `Terms governing use of ${BRAND_NAME}.`,
  alternates: { canonical: BRAND_TERMS_URL },
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <LegalDocument title="Terms of Service" effectiveDate={EFFECTIVE_DATE}>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of {BRAND_NAME} at <a href={BRAND_URL}>{BRAND_URL}</a> (the
          &quot;Service&quot;). By using the Service, you agree to these Terms
          and our <a href={BRAND_PRIVACY_URL}>Privacy Policy</a>.
        </p>

        <h2>1. The Service</h2>
        <p>
          {BRAND_NAME} helps you read long Gmail threads by generating
          structured summaries—stories, timelines, and action lists—from
          conversations you choose. The Service requires signing in with a Google
          account and granting read-only Gmail access.
        </p>
        <p>
          {BRAND_NAME} is an independent tool and is not affiliated with,
          endorsed by, or sponsored by Google LLC or Gmail.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be old enough to use Gmail and enter a binding agreement in
          your jurisdiction. You are responsible for ensuring your use complies
          with applicable laws and any policies that apply to your email
          content.
        </p>

        <h2>3. Your Google account</h2>
        <p>
          You connect the Service to your Google account via OAuth. You are
          responsible for maintaining the security of your Google credentials and
          for activity under your account. You may revoke access at any time in{" "}
          <a
            href="https://myaccount.google.com/permissions"
            rel="noopener noreferrer"
            target="_blank"
          >
            Google Account permissions
          </a>
          .
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to violate any law or third-party rights.</li>
          <li>
            Attempt to access Gmail data you are not authorized to view, or
            bypass security or rate limits.
          </li>
          <li>
            Reverse engineer, scrape, or overload the Service except as
            permitted by law.
          </li>
          <li>
            Misrepresent AI-generated summaries as verbatim copies of original
            emails without verification.
          </li>
        </ul>

        <h2>5. AI-generated content</h2>
        <p>
          Summaries are produced by automated systems (including Google Gemini)
          and may contain errors, omissions, or paraphrasing. They are provided
          for convenience only. <strong>Always verify important details</strong>{" "}
          against the original Gmail messages before making decisions or sharing
          summaries externally.
        </p>

        <h2>6. Intellectual property</h2>
        <p>
          We retain rights in the Service, branding, and software. You retain
          rights in your email content. Generated summaries are provided for your
          personal or internal use; you are responsible for how you export or
          share them.
        </p>

        <h2>7. Availability and changes</h2>
        <p>
          We may modify, suspend, or discontinue features at any time. We do not
          guarantee uninterrupted availability. We may update these Terms;
          material changes will be posted on this page with an updated effective
          date.
        </p>

        <h2>8. Disclaimer of warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
          WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR OPERATORS WILL NOT
          BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING
          FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM
          RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A) AMOUNTS YOU
          PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) EUR 50.
        </p>

        <h2>10. Termination</h2>
        <p>
          You may stop using the Service at any time by signing out and revoking
          Google access. We may suspend or terminate access if you violate these
          Terms or if required for security or legal reasons.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of Slovenia, without regard to
          conflict-of-law rules, except where mandatory consumer protections in
          your country apply.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
        </p>
      </LegalDocument>
    </MarketingShell>
  );
}
