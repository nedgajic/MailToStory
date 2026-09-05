"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { HELP_NAV_LINK } from "@/lib/brand";
import type { PlanId } from "@/lib/billing/plans";
import {
  userMenuNav,
} from "@/lib/settings-nav";
import {
  UserMenuHelpGlyph,
  UserMenuLogOutGlyph,
  userMenuGlyphForHref,
} from "@/components/app-user-menu-glyphs";

function UserMenuItemContent({
  glyph,
  label,
}: {
  glyph: React.ReactNode;
  label: string;
}) {
  return (
    <>
      <span className="app-top-bar__user-item__glyph">{glyph}</span>
      <span className="app-top-bar__user-item__label">{label}</span>
    </>
  );
}

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
  canManageTeam?: boolean;
  plan?: PlanId;
};

export function AppUserMenu({
  className,
  triggerClassName = "",
  canManageTeam: canManageTeamProp,
  plan: planProp,
}: AppUserMenuProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userDropdownPos, setUserDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [navContext, setNavContext] = useState<{
    canManageTeam: boolean;
    plan: PlanId;
  } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { data: session, status: sessionStatus } = useSession();

  const canManageTeam = canManageTeamProp ?? navContext?.canManageTeam ?? false;
  const plan = planProp ?? navContext?.plan ?? "free";

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setNavContext(null);
      return;
    }
    if (canManageTeamProp !== undefined && planProp !== undefined) return;

    let cancelled = false;
    void fetch("/api/settings/menu-context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setNavContext({
          canManageTeam: Boolean(data.canManageTeam),
          plan: (data.plan as PlanId) ?? "free",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, canManageTeamProp, planProp]);

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

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  const accountUser = session?.user;
  const accountLabel =
    accountUser?.name?.trim() ||
    accountUser?.email?.split("@")[0]?.trim() ||
    "Account";
  const accountInitials = getInitials(
    accountUser?.name?.trim() || accountUser?.email || "?",
  );
  const triggerClasses = [
    "app-top-bar__user-trigger",
    triggerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const settingsItems =
    sessionStatus === "authenticated"
      ? userMenuNav({ canManageTeam, plan })
      : [];
  const showAdminLink = session?.user?.isAdmin === true;

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
              {showAdminLink ? (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="app-top-bar__user-item app-top-bar__user-item--link"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserMenuItemContent
                    glyph={userMenuGlyphForHref("/admin")}
                    label="Admin"
                  />
                </Link>
              ) : null}
              {showAdminLink && settingsItems.length > 0 ? (
                <div
                  className="app-top-bar__user-dropdown__divider"
                  role="separator"
                  aria-hidden
                />
              ) : null}
              {settingsItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className="app-top-bar__user-item app-top-bar__user-item--link"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserMenuItemContent
                    glyph={userMenuGlyphForHref(href)}
                    label={label}
                  />
                </Link>
              ))}
              {settingsItems.length > 0 ? (
                <div
                  className="app-top-bar__user-dropdown__divider"
                  role="separator"
                  aria-hidden
                />
              ) : null}
              <a
                href={HELP_NAV_LINK.path}
                role="menuitem"
                className="app-top-bar__user-item app-top-bar__user-item--link"
                onClick={() => setUserMenuOpen(false)}
              >
                <UserMenuItemContent
                  glyph={<UserMenuHelpGlyph />}
                  label={HELP_NAV_LINK.label}
                />
              </a>
              <div
                className="app-top-bar__user-dropdown__divider"
                role="separator"
                aria-hidden
              />
              <button
                type="button"
                role="menuitem"
                className="app-top-bar__user-item"
                onClick={() => {
                  setUserMenuOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
              >
                <UserMenuItemContent
                  glyph={<UserMenuLogOutGlyph />}
                  label="Log out"
                />
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
