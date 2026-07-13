"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { BRAND_NAME, BRAND_ICON_PATH } from "@/lib/brand";
import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export type AppTopBarProps = {
  /** Left / center cluster (e.g. Back link + export actions). Omit on inbox for profile-only bar. */
  startSlot?: ReactNode;
  /** Match content width to the page shell. */
  contentMaxWidth?: "digest" | "inbox";
};

export function AppTopBar({ startSlot, contentMaxWidth = "digest" }: AppTopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userDropdownPos, setUserDropdownPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
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
    if (!userMenuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (userMenuRef.current?.contains(t)) return;
      if (userDropdownRef.current?.contains(t)) return;
      setUserMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  const accountUser = session?.user;
  const accountLabel =
    accountUser?.name?.trim() ||
    accountUser?.email?.split("@")[0]?.trim() ||
    "Account";
  const accountInitials = getInitials(
    accountUser?.name?.trim() || accountUser?.email || "?",
  );

  const innerMods =
    contentMaxWidth === "inbox"
      ? "app-top-bar__inner app-top-bar__inner--inbox"
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
            <div className="app-top-bar__user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="app-top-bar__user-trigger"
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
          </div>
        </div>
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
    </header>
  );
}

/** Brand mark + title for the logged-in app shell. */
export function AppTopBarBrand() {
  return (
    <Link href="/threads" className="app-top-bar__brand">
      <Image
        src={BRAND_ICON_PATH}
        alt=""
        width={28}
        height={28}
        className="app-top-bar__brand-icon"
        priority
      />
      <span className="app-top-bar__brand-text">{BRAND_NAME}</span>
    </Link>
  );
}

/** Convenience: Back link styled for the top bar. */
export function AppTopBarBackLink() {
  return (
    <Link href="/threads" className="app-top-bar__back">
      Back
    </Link>
  );
}
