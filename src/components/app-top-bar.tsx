"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";
import { AppUserMenu } from "@/components/app-user-menu";
import { BRAND_NAME, BRAND_LOGO_TEXT } from "@/lib/brand";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PlanId } from "@/lib/billing/plans";
import "@/app/marketing-home.css";

const APP_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/stories", label: "Stories" },
] as const;

const SETTINGS_NAV = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/billing", label: "Billing & Invoices" },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSettingsActive(pathname: string): boolean {
  return pathname.startsWith("/settings");
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!settingsOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (settingsOpen) {
        if (settingsRef.current?.contains(t)) return;
        setSettingsOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    setSettingsOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const showAdminLink = session?.user?.isAdmin === true;

  const userMenu = (
    <AppUserMenu triggerClassName="app-top-bar__user-trigger--shell" />
  );

  if (showNav) {
    function navClass(href: string) {
      return isNavActive(pathname, href)
        ? "mkt-nav__btn mkt-nav__btn--active"
        : "mkt-nav__btn";
    }

    const settingsActive = isSettingsActive(pathname);

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
              </Link>
            ))}

            <div className="mkt-nav__settings" ref={settingsRef}>
              <button
                type="button"
                className={
                  settingsActive
                    ? "mkt-nav__btn mkt-nav__btn--active mkt-nav__btn--settings"
                    : "mkt-nav__btn mkt-nav__btn--settings"
                }
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((open) => !open)}
              >
                Settings
                <svg
                  className="mkt-nav__chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {settingsOpen ? (
                <div className="mkt-nav__settings-menu" role="menu">
                  {SETTINGS_NAV.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      className={
                        isNavActive(pathname, href)
                          ? "mkt-nav__settings-item mkt-nav__settings-item--active"
                          : "mkt-nav__settings-item"
                      }
                      onClick={() => setSettingsOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {showAdminLink ? (
              <Link href="/admin" className={navClass("/admin")}>
                Admin
              </Link>
            ) : null}
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
                  className={navClass(href) + " mkt-nav__btn--mobile"}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <p className="mkt-mobile-nav__group-label">Settings</p>
              {SETTINGS_NAV.map(({ href, label }) => (
                <Link
                  key={`mobile-${href}`}
                  href={href}
                  className={
                    (isNavActive(pathname, href)
                      ? "mkt-nav__btn mkt-nav__btn--active"
                      : "mkt-nav__btn") + " mkt-nav__btn--mobile mkt-nav__btn--sub"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {showAdminLink ? (
                <Link
                  href="/admin"
                  className={
                    (isNavActive(pathname, "/admin")
                      ? "mkt-nav__btn mkt-nav__btn--active"
                      : "mkt-nav__btn") + " mkt-nav__btn--mobile"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </Link>
              ) : null}
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
