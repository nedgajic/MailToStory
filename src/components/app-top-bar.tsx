"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_NAME, BRAND_LOGO_TEXT, BRAND_COOKIE_PATH, BRAND_DATA_REQUEST_PATH, BRAND_PRIVACY_PATH, BRAND_TERMS_PATH } from "@/lib/brand";
import { isAdminEmail } from "@/lib/admin";
import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PlanId } from "@/lib/billing/plans";
import "@/app/marketing-home.css";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userDropdownPos, setUserDropdownPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { data: session, status: sessionStatus } = useSession();

  useLayoutEffect(() => {
    if (!userMenuOpen) {
      setUserDropdownPos(null);
      return;
    }
    const menuRoot = userMenuRef.current;
    if (!menuRoot || !menuRoot.querySelector(".app-top-bar__user-trigger")) return;

    function updatePosition() {
      const root = userMenuRef.current;
      if (!root) return;
      const btn = root.querySelector<HTMLButtonElement>(".app-top-bar__user-trigger");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setUserDropdownPos({
        top: r.bottom + 6,
        right: window.innerWidth - r.right,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen && !settingsOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (userMenuOpen) {
        if (userMenuRef.current?.contains(t)) return;
        if (userDropdownRef.current?.contains(t)) return;
        setUserMenuOpen(false);
      }
      if (settingsOpen) {
        if (settingsRef.current?.contains(t)) return;
        setSettingsOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen, settingsOpen]);

  useEffect(() => {
    setSettingsOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const accountUser = session?.user;
  const accountLabel =
    accountUser?.name?.trim() ||
    accountUser?.email?.split("@")[0]?.trim() ||
    "Account";
  const accountInitials = getInitials(
    accountUser?.name?.trim() || accountUser?.email || "?",
  );
  const showAdminLink = isAdminEmail(accountUser?.email);

  const userMenu = (
    <>
      <div className="app-top-bar__user-menu" ref={userMenuRef}>
        <button
          type="button"
          className="app-top-bar__user-trigger app-top-bar__user-trigger--shell"
          aria-label={`Account menu for ${accountLabel}`}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          disabled={sessionStatus === "loading"}
          onClick={() => setUserMenuOpen((o) => !o)}
        >
          {accountUser?.image ? (
            <img
              src={accountUser.image}
              alt=""
              width={32}
              height={32}
              className="app-top-bar__user-img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="app-top-bar__user-initials" aria-hidden>
              {sessionStatus === "loading" ? "…" : accountInitials}
            </span>
          )}
        </button>
      </div>
      {userMenuOpen && userDropdownPos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={userDropdownRef}
              className="app-top-bar__user-dropdown app-top-bar__user-dropdown--fixed"
              style={{
                top: userDropdownPos.top,
                right: userDropdownPos.right,
              }}
              role="menu"
            >
              <a
                href={BRAND_PRIVACY_PATH}
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                Privacy Policy
              </a>
              <a
                href={BRAND_COOKIE_PATH}
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                Cookie Policy
              </a>
              <a
                href={BRAND_TERMS_PATH}
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                Terms of Service
              </a>
              <a
                href={BRAND_DATA_REQUEST_PATH}
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                Data Request
              </a>
              <Link
                href="/settings/profile"
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                Profile
              </Link>
              {showAdminLink ? (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="app-top-bar__user-item app-top-bar__user-item--link"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Admin dashboard
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="app-top-bar__user-item"
                onClick={() => {
                  setUserMenuOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
              >
                Log out
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );

  if (showNav) {
    function navClass(href: string) {
      return isNavActive(pathname, href)
        ? "mkt-nav__btn mkt-nav__btn--active"
        : "mkt-nav__btn";
    }

    const settingsActive = isSettingsActive(pathname);

    return (
      <header className="mkt-header sn-site-header app-top-bar app-top-bar--shell" role="banner">
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
          </nav>

          <div className="mkt-header__cta app-top-bar__shell-end">{userMenu}</div>

          <div className="mkt-header__end">
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
