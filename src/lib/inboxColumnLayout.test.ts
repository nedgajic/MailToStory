import { describe, expect, it } from "vitest";
import {
  clampInboxColumnWidth,
  DEFAULT_INBOX_COLUMN_WIDTHS,
  normalizeInboxColumnWidths,
} from "./inboxColumnLayout";

describe("inboxColumnLayout", () => {
  it("clamps column widths to min and max", () => {
    expect(clampInboxColumnWidth("from", 40)).toBe(88);
    expect(clampInboxColumnWidth("from", 500)).toBe(360);
  });

  it("fills missing values with defaults", () => {
    expect(normalizeInboxColumnWidths({ from: 200 })).toEqual({
      from: 200,
      count: DEFAULT_INBOX_COLUMN_WIDTHS.count,
      date: DEFAULT_INBOX_COLUMN_WIDTHS.date,
    });
  });
});
