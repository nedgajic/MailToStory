"use client";

import * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type DigestTabId = "story" | "timeline" | "actions";

type Tab = { id: DigestTabId; label: string };

type TabMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
};

export function DigestTabStrip({
  tabs,
  activeTab,
  onTabChange,
  idPrefix = "digest-tab",
  animated = false,
  className = "",
}: {
  tabs: Tab[];
  activeTab: DigestTabId;
  onTabChange: (id: DigestTabId) => void;
  idPrefix?: string;
  animated?: boolean;
  className?: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef(new Map<DigestTabId, HTMLButtonElement>());
  const [metrics, setMetrics] = useState<TabMetrics>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const updateMetrics = useCallback(() => {
    const strip = stripRef.current;
    const btn = btnRefs.current.get(activeTab);
    if (!strip || !btn) return;

    const stripRect = strip.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    setMetrics({
      left: btnRect.left - stripRect.left,
      top: btnRect.top - stripRect.top,
      width: btnRect.width,
      height: btnRect.height,
      ready: true,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateMetrics();
    const frame = requestAnimationFrame(() => updateMetrics());
    return () => cancelAnimationFrame(frame);
  }, [updateMetrics, tabs, activeTab]);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const ro = new ResizeObserver(() => updateMetrics());
    ro.observe(strip);
    for (const btn of btnRefs.current.values()) {
      ro.observe(btn);
    }
    window.addEventListener("resize", updateMetrics);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [updateMetrics, tabs]);

  const capsuleStyle: React.CSSProperties = {
    transform: `translate3d(${metrics.left}px, ${metrics.top}px, 0)`,
    width: metrics.width,
    height: metrics.height,
    opacity: metrics.ready ? 1 : 0,
  };

  const indicatorStyle: React.CSSProperties = {
    transform: `translate3d(${metrics.left}px, ${metrics.top + metrics.height}px, 0) translateY(-100%)`,
    width: metrics.width,
    opacity: metrics.ready ? 1 : 0,
  };

  const handleSelect = (id: DigestTabId) => {
    if (id === activeTab) return;
    onTabChange(id);
  };

  return (
    <div
      className={`digest-tab-strip-wrap${animated ? " digest-tab-strip-wrap--animated" : ""}${className ? ` ${className}` : ""}`}
    >
      <div
        ref={stripRef}
        className={`digest-tab-strip${animated ? " digest-tab-strip--animated" : ""}`}
        role="tablist"
        aria-label="Story sections"
      >
        {animated ? (
          <span className="digest-tab-strip__pill" style={capsuleStyle} aria-hidden />
        ) : null}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) btnRefs.current.set(tab.id, el);
              else btnRefs.current.delete(tab.id);
            }}
            id={`${idPrefix}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${idPrefix.replace("-tab", "-panel")}-${tab.id}`}
            className={`digest-tab-btn ${activeTab === tab.id ? "digest-tab-btn-active" : ""}`}
            onClick={() => handleSelect(tab.id)}
          >
            <span className="digest-tab-text">{tab.label}</span>
          </button>
        ))}
        {animated ? (
          <span
            className="digest-tab-strip__indicator"
            style={indicatorStyle}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
