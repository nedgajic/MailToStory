"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MobileNavItem,
  MobileNavSection,
} from "@/components/mobile-nav-panel";
import {
  StoriesNavBadge,
  useStoriesNavBadgeCount,
} from "@/components/stories/stories-nav-badge";

const APP_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/stories", label: "Stories" },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileAppNavSection({
  onNavigate,
  storiesBadgeEnabled = true,
}: {
  onNavigate: () => void;
  storiesBadgeEnabled?: boolean;
}) {
  const pathname = usePathname();
  const { status } = useSession();
  const storiesBadgeCount = useStoriesNavBadgeCount(
    storiesBadgeEnabled && status === "authenticated",
  );

  return (
    <MobileNavSection label="Dashboard">
      {APP_LINKS.map(({ href, label }) => (
        <MobileNavItem
          key={href}
          href={href}
          active={isNavActive(pathname, href)}
          onClick={onNavigate}
        >
          {label}
          {href === "/stories" && storiesBadgeEnabled ? (
            <StoriesNavBadge count={storiesBadgeCount} />
          ) : null}
        </MobileNavItem>
      ))}
    </MobileNavSection>
  );
}
