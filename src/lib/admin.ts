const DEFAULT_ADMIN_EMAILS = ["nedgajic@gmail.com"];

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return DEFAULT_ADMIN_EMAILS;
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** @deprecated Use adminEmails() — kept for existing imports. */
export const ADMIN_EMAIL = DEFAULT_ADMIN_EMAILS[0]!;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
