"use client";

import { ThreadWorkspace, type ThreadWorkspacePhase } from "@/components/thread/ThreadWorkspace";
import type { ThreadListItem } from "@/lib/gmail";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const LIST_DEFAULT = 380;
const LIST_MIN = 240;
const LIST_MAX_RATIO = 0.58;
const LIST_COLLAPSED = 52;

function clampListWidth(width: number, containerWidth: number): number {
  const max = Math.max(LIST_MIN, Math.floor(containerWidth * LIST_MAX_RATIO));
  return Math.min(max, Math.max(LIST_MIN, width));
}

function IconPanelExpand() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M8.6 6L7.2 7.4l4.6 4.6-4.6 4.6L8.6 18l6-6-6-6z"
      />
    </svg>
  );
}

function IconPanelCollapse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M15.4 7.4L14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6z"
      />
    </svg>
  );
}

type InboxSplitLayoutProps = {
  list: ReactNode;
  selectedThreadId: string | null;
  onCloseThread: () => void;
};

export function InboxSplitLayout({
  list,
  selectedThreadId,
  onCloseThread,
}: InboxSplitLayoutProps) {
  const splitRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const [listWidth, setListWidth] = useState(LIST_DEFAULT);
  const [savedListWidth, setSavedListWidth] = useState(LIST_DEFAULT);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [workspacePhase, setWorkspacePhase] = useState<ThreadWorkspacePhase>("idle");
  const [isDragging, setIsDragging] = useState(false);

  const storyFullscreen = workspacePhase === "story";

  useEffect(() => {
    setWorkspacePhase("idle");
    setListCollapsed(false);
  }, [selectedThreadId]);

  const expandList = useCallback(() => {
    setListCollapsed(false);
    setListWidth(savedListWidth);
  }, [savedListWidth]);

  const collapseList = useCallback(() => {
    setSavedListWidth(listWidth);
    setListCollapsed(true);
  }, [listWidth]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (listCollapsed) return;
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startWidth: listWidth };
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [listCollapsed, listWidth],
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || !splitRef.current) return;
      const containerWidth = splitRef.current.getBoundingClientRect().width;
      const delta = e.clientX - dragRef.current.startX;
      const next = clampListWidth(
        dragRef.current.startWidth + delta,
        containerWidth,
      );
      setListWidth(next);
    },
    [],
  );

  const endResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  }, []);

  const splitOpen = Boolean(selectedThreadId);
  const paneWidth = listCollapsed ? LIST_COLLAPSED : listWidth;

  return (
    <div
      ref={splitRef}
      className={[
        "inbox-split",
        splitOpen ? "inbox-split--detail-open" : "",
        storyFullscreen ? "inbox-split--story" : "",
        listCollapsed ? "inbox-split--list-collapsed" : "",
        isDragging ? "inbox-split--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="inbox-split__list-pane"
        style={{ width: paneWidth }}
      >
        {listCollapsed ? (
          <button
            type="button"
            className="inbox-split__expand-tab"
            onClick={expandList}
            aria-label="Show inbox list"
            title="Show inbox"
          >
            <IconPanelExpand />
            <span className="inbox-split__expand-label">Inbox</span>
          </button>
        ) : (
          <div className="inbox-split__list">{list}</div>
        )}
      </div>

      {!listCollapsed ? (
        <div
          className="inbox-split__resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize inbox list"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        >
          {splitOpen ? (
            <button
              type="button"
              className="inbox-split__collapse-btn"
              aria-label="Collapse inbox list"
              title="Hide inbox"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                collapseList();
              }}
            >
              <IconPanelCollapse />
            </button>
          ) : null}
        </div>
      ) : null}

      <aside
        className="inbox-split__detail"
        aria-label={selectedThreadId ? "Thread preview" : "Select a thread"}
      >
        {selectedThreadId ? (
          <ThreadWorkspace
            key={selectedThreadId}
            threadId={selectedThreadId}
            embedded
            onClose={onCloseThread}
            onPhaseChange={setWorkspacePhase}
          />
        ) : (
          <div className="inbox-split__empty">
            <p className="inbox-split__empty-title">Select a thread</p>
            <p className="inbox-split__empty-hint">
              Choose a conversation from the list to preview the latest message
              and generate a story.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
