"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";
import { AppUserMenu } from "@/components/app-user-menu";
import { BRAND_LOGO_TEXT, BRAND_NAME } from "@/lib/brand";
import {
  MarketingHeaderAuth,
  MarketingMobileNavAuth,
} from "@/components/landing/marketing-auth-cta";
import "@/app/marketing-home.css";

const NAV_ITEMS = [
  { id: "demo", label: "Demo" },
  { id: "how-it-works", label: "How it works" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function MarketingHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const signedIn = mounted && status === "authenticated";

  function go(id: string) {
    setMenuOpen(false);
    scrollToId(id);
  }

  const logoMark = (
    <>
      <BrandLogo
        width={56}
        height={56}
        className="mkt-logo__img"
        priority
      />
      <span className="mkt-logo__word">{BRAND_LOGO_TEXT}</span>
    </>
  );

  return (
    <header className="mkt-header mkt-header--scrolled sn-site-header">
      <div className="mkt-container mkt-header__inner">
        {onHome ? (
          <button
            type="button"
            className="mkt-logo"
            onClick={() => go("home")}
            aria-label={`${BRAND_NAME} home`}
          >
            {logoMark}
          </button>
        ) : (
          <Link href="/" className="mkt-logo" aria-label={`${BRAND_NAME} home`}>
            {logoMark}
          </Link>
        )}

        <nav className="mkt-nav sn-site-header__nav-pill" aria-label="Primary">
          {NAV_ITEMS.map(({ id, label }) =>
            onHome ? (
              <button
                key={id}
                type="button"
                className="mkt-nav__btn"
                onClick={() => go(id)}
              >
                {label}
              </button>
            ) : (
              <Link
                key={id}
                href={`/#${id}`}
                className="mkt-nav__btn"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="mkt-header__cta">
          <MarketingHeaderAuth />
        </div>

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
          {signedIn ? (
            <AppUserMenu
              className="mkt-header__user-menu--mobile"
              triggerClassName="app-top-bar__user-trigger--shell"
            />
          ) : null}
        </div>
      </div>

      {menuOpen ? (
        <div className="mkt-container">
          <div className="mkt-mobile-nav">
            {NAV_ITEMS.map(({ id, label }) =>
              onHome ? (
                <button
                  key={`mobile-${id}`}
                  type="button"
                  className="mkt-nav__btn mkt-nav__btn--mobile"
                  onClick={() => go(id)}
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={`mobile-${id}`}
                  href={`/#${id}`}
                  className="mkt-nav__btn mkt-nav__btn--mobile"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ),
            )}
            <MarketingMobileNavAuth />
          </div>
        </div>
      ) : null}
    </header>
  );
}
