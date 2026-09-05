"use client";

import Link from "next/link";
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
  const sections = visibleSettingsSections({ canManageTeam, plan });

  return (
    <nav className="settings-sidebar" aria-label="Settings sections">
      <ul className="settings-sidebar__list">
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
    </nav>
  );
}
