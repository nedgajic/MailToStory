import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpDocument } from "@/components/help/help-document";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { BRAND_HELP_URL, BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";
import { HELP_ARTICLE_BY_SLUG, HELP_ARTICLE_SLUGS } from "@/lib/help/articles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return HELP_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = HELP_ARTICLE_BY_SLUG[slug];
  if (!article) return { title: `Help — ${BRAND_NAME}` };
  return {
    title: `${article.title} — Help — ${BRAND_NAME}`,
    description: article.summary,
    alternates: { canonical: `${BRAND_HELP_URL}/${article.slug}` },
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = HELP_ARTICLE_BY_SLUG[slug];
  if (!article) notFound();

  return (
    <MarketingShell>
      <HelpDocument article={article}>
        {slug === "contact-support" ? null : (
          <p>
            Need more help? Email{" "}
            <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>.
          </p>
        )}
      </HelpDocument>
    </MarketingShell>
  );
}
