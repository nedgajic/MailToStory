"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

export type AppToastAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type AppToastInput = {
  message: string;
  action?: AppToastAction;
};

type AppToast = AppToastInput & { id: string };

type AppToastContextValue = {
  showToast: (toast: AppToastInput) => void;
};

const AppToastContext = createContext<AppToastContextValue | null>(null);

export function useAppToast(): AppToastContextValue {
  const ctx = useContext(AppToastContext);
  if (!ctx) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return ctx;
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: AppToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => dismiss(id), 7000);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <AppToastContext.Provider value={value}>
      {children}
      <div className="app-toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className="app-toast" role="status">
            <p className="app-toast__message">{toast.message}</p>
            {toast.action ? (
              toast.action.href ? (
                <Link
                  href={toast.action.href}
                  className="app-toast__action"
                  onClick={() => dismiss(toast.id)}
                >
                  {toast.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className="app-toast__action"
                  onClick={() => {
                    toast.action?.onClick?.();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )
            ) : null}
            <button
              type="button"
              className="app-toast__dismiss"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AppToastContext.Provider>
  );
}
