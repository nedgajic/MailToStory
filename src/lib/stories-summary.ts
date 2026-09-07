import { listActiveQuarantine } from "@/lib/inbound/quarantine";
import { quarantineSenderFilter } from "@/lib/inbound/quarantine-access";
import { getUnreadStoryIds } from "@/lib/story-views";
import type { WorkspaceContext } from "@/lib/session";

export type QuarantineListItem = {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  createdAt: string;
};

export type StoriesLibrarySummary = {
  unreadStoryIds: string[];
  unreadStoryCount: number;
  quarantineCount: number;
  navBadgeCount: number;
  quarantine: QuarantineListItem[];
};

export async function getStoriesLibrarySummary(
  ctx: WorkspaceContext,
  userId: string,
): Promise<StoriesLibrarySummary> {
  const filter = quarantineSenderFilter(ctx);
  const [unreadStoryIds, quarantineRows] = await Promise.all([
    getUnreadStoryIds(userId, ctx.workspace.id),
    filter.fromEmail === "__none__"
      ? Promise.resolve([])
      : listActiveQuarantine(ctx.workspace.id, filter),
  ]);

  const quarantine: QuarantineListItem[] = quarantineRows.map((item) => ({
    id: item.id,
    fromEmail: item.fromEmail,
    fromName: item.fromName,
    subject: item.subject,
    snippet: item.snippet,
    createdAt: item.createdAt.toISOString(),
  }));

  const unreadStoryCount = unreadStoryIds.size;

  return {
    unreadStoryIds: Array.from(unreadStoryIds),
    unreadStoryCount,
    quarantineCount: quarantine.length,
    navBadgeCount: unreadStoryCount + quarantine.length,
    quarantine,
  };
}
