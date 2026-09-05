"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { AppUserMenu } from "@/components/app-user-menu";
import { BRAND_NAME, BRAND_LOGO_TEXT } from "@/lib/brand";
import { useEffect, useState, type ReactNode } from "react";
import {
  StoriesNavBadge,
  useStoriesNavBadgeCount,
} from "@/components/stories/stories-nav-badge";
import type { PlanId } from "@/lib/billing/plans";
import "@/app/marketing-home.css";

const APP_NAV: readonly { href: string; label: string }[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/stories", label: "Stories" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type AppTopBarProps = {
  startSlot?: ReactNode;
  contentMaxWidth?: "digest" | "inbox" | "app";
  showNav?: boolean;
  canManageTeam?: boolean;
  plan?: PlanId;
  billingLabel?: string | null;
};

export function AppTopBar({
  startSlot,
  contentMaxWidth = "digest",
  showNav = false,
  canManageTeam = false,
  plan = "free",
  billingLabel = null,
}: AppTopBarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const storiesNavBadgeCount = useStoriesNavBadgeCount(showNav);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const userMenu = (
    <AppUserMenu
      triggerClassName="app-top-bar__user-trigger--shell"
      canManageTeam={canManageTeam}
      plan={plan}
    />
  );

  if (showNav) {
    function navClass(href: string) {
      const classes = ["mkt-nav__btn"];
      if (isNavActive(pathname, href)) classes.push("mkt-nav__btn--active");
      return classes.join(" ");
    }

    return (
      <header
        className="mkt-header mkt-header--scrolled sn-site-header app-top-bar app-top-bar--shell"
        role="banner"
      >
        <div className="mkt-container mkt-header__inner">
          <Link href="/" className="mkt-logo" aria-label={`${BRAND_NAME} home`}>
            <BrandLogo
              width={56}
              height={56}
              className="mkt-logo__img"
              priority
            />
            <span className="mkt-logo__word">{BRAND_LOGO_TEXT}</span>
          </Link>

          <nav className="mkt-nav sn-site-header__nav-pill" aria-label="App">
            {APP_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={navClass(href)}>
                {label}
                {href === "/stories" ? (
                  <StoriesNavBadge count={storiesNavBadgeCount} />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="mkt-header__cta app-top-bar__shell-end app-top-bar__shell-user app-top-bar__shell-user--desktop">
            {userMenu}
          </div>

          <div className="mkt-header__end app-top-bar__shell-mobile-end">
            <button
              type="button"
              className="mkt-header__menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <div className="app-top-bar__shell-user app-top-bar__shell-user--mobile">
              {userMenu}
            </div>
          </div>
        </div>

        {menuOpen ? (
          <div className="mkt-container">
            <div className="mkt-mobile-nav">
              {APP_NAV.map(({ href, label }) => (
                <Link
                  key={`mobile-${href}`}
                  href={href}
                  className={`${navClass(href)} mkt-nav__btn--mobile`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                  {href === "/stories" ? (
                    <StoriesNavBadge count={storiesNavBadgeCount} />
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>
    );
  }

  const innerMods =
    contentMaxWidth === "inbox"
      ? "app-top-bar__inner app-top-bar__inner--inbox"
      : contentMaxWidth === "app"
        ? "app-top-bar__inner app-top-bar__inner--app"
        : "app-top-bar__inner app-top-bar__inner--digest";

  const headerClass =
    contentMaxWidth === "inbox"
      ? "app-top-bar app-top-bar--inbox"
      : "app-top-bar";

  return (
    <header className={headerClass} role="banner" data-app-top-bar="">
      <div className={innerMods}>
        <div className="app-top-bar__row">
          <div className="app-top-bar__lead">
            <AppTopBarBrand />
            {startSlot ? (
              <div className="app-top-bar__start">{startSlot}</div>
            ) : null}
          </div>
          <div className="app-top-bar__end">
            {billingLabel ? (
              <p className="app-top-bar__bill">{billingLabel}</p>
            ) : null}
            {userMenu}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Brand mark + title for the logged-in app shell. */
export function AppTopBarBrand() {
  return (
    <Link href="/" className="app-top-bar__brand">
      <BrandLogo
        width={28}
        height={28}
        className="app-top-bar__brand-icon"
        priority
      />
      <span className="app-top-bar__brand-text">{BRAND_LOGO_TEXT}</span>
    </Link>
  );
}

/** Convenience: Back link styled for the top bar. */
export function AppTopBarBackLink() {
  return (
    <Link href="/dashboard" className="app-top-bar__back">
      Back
    </Link>
  );
}
