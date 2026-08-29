"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HELP_NAV_LINK } from "@/lib/brand";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type AppUserMenuProps = {
  className?: string;
  triggerClassName?: string;
};

export function AppUserMenu({
  className,
  triggerClassName = "",
}: AppUserMenuProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userDropdownPos, setUserDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);
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
  const showAdminLink = accountUser?.isAdmin === true;
  const triggerClasses = [
    "app-top-bar__user-trigger",
    triggerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={["app-top-bar__user-menu", className].filter(Boolean).join(" ")}
        ref={userMenuRef}
      >
        <button
          type="button"
          className={triggerClasses}
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
              <Link
                href="/dashboard"
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                Dashboard
              </Link>
              <a
                href={HELP_NAV_LINK.path}
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                {HELP_NAV_LINK.label}
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
}
