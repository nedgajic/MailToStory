import Link from "next/link";
import type { ReactNode } from "react";
import type { HelpArticle } from "@/lib/help/articles";
import { BRAND_HELP_PATH } from "@/lib/brand";

export function HelpDocument({ article, children }: { article: HelpArticle; children?: ReactNode }) {
  return (
    <article className="home-legal">
      <div className="home-legal__inner">
        <p className="home-kicker">Help center</p>
        <h1 className="home-section__title home-legal__title">{article.title}</h1>
        <p className="home-legal__meta">{article.summary}</p>
        <div className="home-legal-prose">
          {article.sections.map((section) => (
            <section key={section.heading ?? section.paragraphs?.[0] ?? section.bullets?.[0] ?? "section"}>
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          {children}
        </div>
        <p className="help-back-link">
          <Link href={BRAND_HELP_PATH}>← All help articles</Link>
        </p>
      </div>
    </article>
  );
}
