import type { ReactNode } from "react";
import { AppShellFooter } from "@/components/app-shell-footer";
import { MarketingHeader } from "@/components/landing/marketing-header";

type MarketingShellProps = {
  children: ReactNode;
  /** @deprecated Auth CTAs now match the homepage header on all shell pages. */
  showSignIn?: boolean;
};

export function MarketingShell({
  children,
  showSignIn: _showSignIn = false,
}: MarketingShellProps) {
  return (
    <div className="home home--marketing-header">
      <div className="home-bg" aria-hidden="true">
        <div className="home-bg__mesh" />
        <div className="home-bg__grain" />
      </div>

      <MarketingHeader />

      <main>{children}</main>

      <AppShellFooter />
    </div>
  );
}
