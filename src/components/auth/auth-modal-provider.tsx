"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_LOGO_TEXT } from "@/lib/brand";

type AuthMode = "login" | "signup";

type AuthModalContextValue = {
  open: boolean;
  mode: AuthMode;
  callbackUrl: string;
  openAuth: (mode: AuthMode, callbackUrl?: string) => void;
  closeAuth: () => void;
  switchMode: (mode: AuthMode) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}

function AuthModalPanel({
  googleEnabled,
  open,
  mode,
  callbackUrl,
  onClose,
  onSwitchMode,
}: {
  googleEnabled: boolean;
  open: boolean;
  mode: AuthMode;
  callbackUrl: string;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="auth-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="authModalTitle"
    >
      <button
        type="button"
        className="auth-modal__backdrop"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <div className="auth-modal__panel">
        <button
          type="button"
          className="auth-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="auth-modal__body">
          <div className="auth-modal__brand">
            <BrandLogo width={36} height={36} priority />
            <span className="auth-modal__brand-name">{BRAND_LOGO_TEXT}</span>
          </div>
          <AuthForm
            variant="modal"
            mode={mode}
            googleEnabled={googleEnabled}
            callbackUrl={callbackUrl}
            onSwitchMode={onSwitchMode}
          />
        </div>
      </div>
    </div>
  );
}

function AuthModalProviderInner({
  children,
  googleEnabled,
}: {
  children: ReactNode;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const auth = searchParams.get("auth");
  const open = auth === "login" || auth === "signup";
  const mode: AuthMode = auth === "signup" ? "signup" : "login";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const syncUrl = useCallback(
    (nextMode: AuthMode | null, nextCallbackUrl?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextMode) {
        params.set("auth", nextMode);
        if (nextCallbackUrl && nextCallbackUrl !== "/dashboard") {
          params.set("callbackUrl", nextCallbackUrl);
        } else {
          params.delete("callbackUrl");
        }
      } else {
        params.delete("auth");
        params.delete("callbackUrl");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openAuth = useCallback(
    (nextMode: AuthMode, nextCallbackUrl = "/dashboard") => {
      syncUrl(nextMode, nextCallbackUrl);
    },
    [syncUrl],
  );

  const closeAuth = useCallback(() => {
    syncUrl(null);
  }, [syncUrl]);

  const switchMode = useCallback(
    (nextMode: AuthMode) => {
      syncUrl(nextMode, callbackUrl);
    },
    [callbackUrl, syncUrl],
  );

  const value = useMemo(
    () => ({
      open,
      mode,
      callbackUrl,
      openAuth,
      closeAuth,
      switchMode,
    }),
    [open, mode, callbackUrl, openAuth, closeAuth, switchMode],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModalPanel
        googleEnabled={googleEnabled}
        open={open}
        mode={mode}
        callbackUrl={callbackUrl}
        onClose={closeAuth}
        onSwitchMode={switchMode}
      />
    </AuthModalContext.Provider>
  );
}

export function AuthModalProvider({
  children,
  googleEnabled,
}: {
  children: ReactNode;
  googleEnabled: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <AuthModalProviderInner googleEnabled={googleEnabled}>
        {children}
      </AuthModalProviderInner>
    </Suspense>
  );
}
