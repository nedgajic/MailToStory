import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { BRAND_HELP_URL, BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";
import { HELP_ARTICLES } from "@/lib/help/articles";

export const metadata: Metadata = {
  title: `Help center — ${BRAND_NAME}`,
  description: `Guides and answers for using ${BRAND_NAME}.`,
  alternates: { canonical: BRAND_HELP_URL },
};

export default function HelpCenterPage() {
  return (
    <MarketingShell>
      <article className="home-legal">
        <div className="home-legal__inner">
          <p className="home-kicker">Help center</p>
          <h1 className="home-section__title home-legal__title">How can we help?</h1>
          <p className="home-legal__meta">
            Guides for forwarding mail, story limits, billing, and troubleshooting.
          </p>
          <div className="help-index">
            {HELP_ARTICLES.map((article) => (
              <Link key={article.slug} href={`/help/${article.slug}`} className="help-index__card">
                <h2>{article.title}</h2>
                <p>{article.summary}</p>
              </Link>
            ))}
          </div>
          <p className="home-legal__meta">
            Still stuck? Email{" "}
            <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
          </p>
        </div>
      </article>
    </MarketingShell>
  );
}
