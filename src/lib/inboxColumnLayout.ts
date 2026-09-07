export type InboxColumnKey = "from" | "count" | "date";

export type InboxColumnWidths = Record<InboxColumnKey, number>;

export type InboxColumnStyleVars = {
  "--inbox-col-from": string;
  "--inbox-col-count": string;
  "--inbox-col-date": string;
};

export const INBOX_COLUMN_WIDTHS_STORAGE_KEY = "inbox-column-widths";

export const DEFAULT_INBOX_COLUMN_WIDTHS: InboxColumnWidths = {
  from: 184,
  count: 52,
  date: 76,
};

export const INBOX_COLUMN_MIN: InboxColumnWidths = {
  from: 88,
  count: 36,
  date: 56,
};

export const INBOX_COLUMN_MAX: InboxColumnWidths = {
  from: 360,
  count: 88,
  date: 140,
};

export function clampInboxColumnWidth(
  column: InboxColumnKey,
  value: number,
): number {
  return Math.min(
    INBOX_COLUMN_MAX[column],
    Math.max(INBOX_COLUMN_MIN[column], Math.round(value)),
  );
}

export function normalizeInboxColumnWidths(
  value: Partial<InboxColumnWidths> | null | undefined,
): InboxColumnWidths {
  return {
    from: clampInboxColumnWidth(
      "from",
      value?.from ?? DEFAULT_INBOX_COLUMN_WIDTHS.from,
    ),
    count: clampInboxColumnWidth(
      "count",
      value?.count ?? DEFAULT_INBOX_COLUMN_WIDTHS.count,
    ),
    date: clampInboxColumnWidth(
      "date",
      value?.date ?? DEFAULT_INBOX_COLUMN_WIDTHS.date,
    ),
  };
}

export function readStoredInboxColumnWidths(): InboxColumnWidths {
  if (typeof window === "undefined") {
    return DEFAULT_INBOX_COLUMN_WIDTHS;
  }
  try {
    const raw = localStorage.getItem(INBOX_COLUMN_WIDTHS_STORAGE_KEY);
    if (!raw) return DEFAULT_INBOX_COLUMN_WIDTHS;
    return normalizeInboxColumnWidths(JSON.parse(raw) as Partial<InboxColumnWidths>);
  } catch {
    return DEFAULT_INBOX_COLUMN_WIDTHS;
  }
}

export function persistInboxColumnWidths(widths: InboxColumnWidths) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      INBOX_COLUMN_WIDTHS_STORAGE_KEY,
      JSON.stringify(normalizeInboxColumnWidths(widths)),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function inboxColumnWidthsToStyle(
  widths: InboxColumnWidths,
): InboxColumnStyleVars {
  return {
    "--inbox-col-from": `${widths.from}px`,
    "--inbox-col-count": `${widths.count}px`,
    "--inbox-col-date": `${widths.date}px`,
  };
}
