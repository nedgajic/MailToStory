import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalDocument({
  title,
  effectiveDate,
  children,
}: LegalDocumentProps) {
  return (
    <article className="home-legal">
      <div className="home-legal__inner">
        <p className="home-kicker">Legal</p>
        <h1 className="home-section__title home-legal__title">{title}</h1>
        <p className="home-legal__meta">Effective date: {effectiveDate}</p>
        <div className="home-legal-prose">{children}</div>
      </div>
    </article>
  );
}
