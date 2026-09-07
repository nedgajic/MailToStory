"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { visibleSettingsSections } from "@/lib/settings-nav";
import type { PlanId } from "@/lib/billing/plans";

export function SettingsSidebar({
  canManageTeam,
  plan,
}: {
  canManageTeam: boolean;
  plan: PlanId;
}) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const sections = visibleSettingsSections({ canManageTeam, plan });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(".settings-sidebar__link--active");
    if (!active || !window.matchMedia("(max-width: 768px)").matches) return;

    const target =
      active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [pathname]);

  return (
    <nav className="settings-sidebar" aria-label="Settings sections">
      <div className="settings-sidebar__track">
        <ul ref={listRef} className="settings-sidebar__list">
        {sections.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  active
                    ? "settings-sidebar__link settings-sidebar__link--active"
                    : "settings-sidebar__link"
                }
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      </div>
    </nav>
  );
}
