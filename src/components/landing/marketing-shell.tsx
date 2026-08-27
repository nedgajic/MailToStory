import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MarketingNavActions } from "@/components/landing/marketing-nav-actions";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { BRAND_ICON_PATH, BRAND_NAME } from "@/lib/brand";

type MarketingShellProps = {
  children: ReactNode;
  /** Show Google sign-in in the top bar (default: false on legal pages). */
  showSignIn?: boolean;
};

export function MarketingShell({
  children,
  showSignIn = false,
}: MarketingShellProps) {
  return (
    <div className="home">
      <div className="home-bg" aria-hidden="true">
        <div className="home-bg__mesh" />
        <div className="home-bg__grain" />
      </div>

      <header className="home-nav">
        <div
          className={
            showSignIn
              ? "home-nav__inner"
              : "home-nav__inner home-nav__inner--with-brand"
          }
        >
          <Link href="/" className="home-logo home-logo--nav">
            <Image
              src={BRAND_ICON_PATH}
              alt=""
              width={32}
              height={32}
              className="home-logo__mark home-logo__mark--nav"
            />
            <span className="home-logo__text">{BRAND_NAME}</span>
          </Link>
          <MarketingNavActions showSignIn={showSignIn} />
        </div>
      </header>

      <main>{children}</main>

      <MarketingFooter />
    </div>
  );
}
