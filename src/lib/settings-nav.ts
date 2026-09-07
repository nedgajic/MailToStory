export type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  /** Only workspace admins see this item. */
  adminOnly?: boolean;
  /** Only shown on the Team plan. */
  teamPlanOnly?: boolean;
};

export const SETTINGS_SECTIONS: readonly SettingsNavItem[] = [
  {
    href: "/settings/profile",
    label: "Profile",
    description: "Your photo and display name.",
  },
  {
    href: "/settings/account",
    label: "Account",
    description: "Sign-in email, password, and two-factor authentication.",
  },
  {
    href: "/settings/email",
    label: "Email & forwarding",
    description: "Inbound address, allowed senders, and held mail.",
  },
  {
    href: "/settings/stories",
    label: "Stories",
    description: "Story-ready emails and default story length.",
  },
  {
    href: "/settings/billing",
    label: "Billing & invoices",
    description: "Plan, payment method, and invoices.",
  },
  {
    href: "/settings/team",
    label: "Team",
    description: "Seats, invites, and shared inbox.",
    adminOnly: true,
    teamPlanOnly: true,
  },
  {
    href: "/settings/privacy",
    label: "Privacy & data",
    description: "Export your data or delete your account.",
  },
];

export function visibleSettingsSections(input: {
  canManageTeam: boolean;
  plan: string;
}): SettingsNavItem[] {
  return SETTINGS_SECTIONS.filter((item) => {
    if (item.adminOnly && !input.canManageTeam) return false;
    if (item.teamPlanOnly && input.plan !== "team") return false;
    return true;
  });
}

export function defaultSettingsPath(input: {
  canManageTeam: boolean;
  plan: string;
}): string {
  return visibleSettingsSections(input)[0]?.href ?? "/settings/profile";
}

/** User initials menu — Settings first, then shortcuts to major areas. */
export function userMenuNav(input: {
  canManageTeam: boolean;
  plan: string;
}): { href: string; label: string }[] {
  const items: { href: string; label: string }[] = [
    { href: defaultSettingsPath(input), label: "Settings" },
  ];
  if (input.canManageTeam && input.plan === "team") {
    items.push({ href: "/settings/team", label: "Team" });
  }
  return items;
}

/** @deprecated Use userMenuNav */
export const profileMenuNav = userMenuNav;
