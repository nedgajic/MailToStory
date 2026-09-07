"use client";

import {
  clampInboxColumnWidth,
  inboxColumnWidthsToStyle,
  persistInboxColumnWidths,
  readStoredInboxColumnWidths,
  type InboxColumnKey,
  type InboxColumnStyleVars,
  type InboxColumnWidths,
} from "@/lib/inboxColumnLayout";
import * as React from "react";

export function useInboxColumnWidths() {
  const [widths, setWidths] = React.useState<InboxColumnWidths>(() =>
    readStoredInboxColumnWidths(),
  );

  const columnStyle = React.useMemo(
    (): InboxColumnStyleVars & React.CSSProperties =>
      inboxColumnWidthsToStyle(widths),
    [widths],
  );

  const startResize = React.useCallback(
    (column: InboxColumnKey, startX: number) => {
      const startWidth = widths[column];
      document.body.classList.add("inbox-col-resizing");

      function onMove(event: MouseEvent) {
        const next = clampInboxColumnWidth(
          column,
          startWidth + (event.clientX - startX),
        );
        setWidths((current) =>
          current[column] === next ? current : { ...current, [column]: next },
        );
      }

      function onUp() {
        document.body.classList.remove("inbox-col-resizing");
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setWidths((current) => {
          persistInboxColumnWidths(current);
          return current;
        });
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [widths],
  );

  return { widths, columnStyle, startResize };
}
