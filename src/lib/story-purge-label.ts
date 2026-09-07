import { daysUntilPurge } from "@/lib/story-retention";

export function formatPurgeDetail(purgeAt: string | Date, now = new Date()): string {
  const purgeDate = purgeAt instanceof Date ? purgeAt : new Date(purgeAt);
  const daysLeft = daysUntilPurge(purgeDate, now);
  const purgeLabel = purgeDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (daysLeft === 0) return "Permanently deletes today";
  if (daysLeft === 1) return "Permanently deletes tomorrow";
  return `Permanently deletes ${purgeLabel} (${daysLeft} days left)`;
}
