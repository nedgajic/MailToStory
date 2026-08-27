"use client";

import Image from "next/image";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND_ICON_PATH, BRAND_NAME } from "@/lib/brand";
import {
  MarketingHeaderAuth,
  MarketingMobileNavAuth,
} from "@/components/landing/marketing-auth-cta";

const NAV_ITEMS = [
  { id: "features", label: "Features" },
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
  const [menuOpen, setMenuOpen] = useState(false);

  function go(id: string) {
    setMenuOpen(false);
    scrollToId(id);
  }

  return (
    <header className="mkt-header mkt-header--scrolled sn-site-header">
      <div className="mkt-container mkt-header__inner">
        <button
          type="button"
          className="mkt-logo"
          onClick={() => go("home")}
          aria-label={`${BRAND_NAME} home`}
        >
          <Image
            src={BRAND_ICON_PATH}
            alt=""
            width={40}
            height={40}
            className="mkt-logo__img"
            priority
          />
          <span className="mkt-logo__word">{BRAND_NAME}</span>
        </button>

        <nav className="mkt-nav sn-site-header__nav-pill" aria-label="Primary">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className="mkt-nav__btn"
              onClick={() => go(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="mkt-header__cta">
          <ThemeToggle />
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
        </div>
      </div>

      {menuOpen ? (
        <div className="mkt-container">
          <div className="mkt-mobile-nav">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={`mobile-${id}`}
                type="button"
                className="mkt-nav__btn mkt-nav__btn--mobile"
                onClick={() => go(id)}
              >
                {label}
              </button>
            ))}
            <div className="mkt-mobile-nav__theme">
              <ThemeToggle />
            </div>
            <MarketingMobileNavAuth />
          </div>
        </div>
      ) : null}
    </header>
  );
}
