"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type SettingsFeedbackContextValue = {
  showFeedback: (message: string) => void;
};

const SettingsFeedbackContext = createContext<SettingsFeedbackContextValue | null>(null);

const FEEDBACK_DURATION_MS = 4500;

export function useSettingsFeedback(): SettingsFeedbackContextValue {
  const ctx = useContext(SettingsFeedbackContext);
  if (!ctx) {
    throw new Error("useSettingsFeedback must be used within SettingsFeedbackProvider");
  }
  return ctx;
}

export function SettingsFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showFeedback = useCallback(
    (next: string) => {
      clearTimer();
      setMessage(next);
      timeoutRef.current = window.setTimeout(() => {
        setMessage(null);
        timeoutRef.current = null;
      }, FEEDBACK_DURATION_MS);
    },
    [clearTimer],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const value = useMemo(() => ({ showFeedback }), [showFeedback]);

  const banner =
    message && typeof document !== "undefined"
      ? createPortal(
          <div className="settings-feedback-overlay" role="presentation">
            <div className="settings-feedback-banner" role="status">
              <p className="settings-feedback-banner__message">{message}</p>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <SettingsFeedbackContext.Provider value={value}>
      {banner}
      {children}
    </SettingsFeedbackContext.Provider>
  );
}
