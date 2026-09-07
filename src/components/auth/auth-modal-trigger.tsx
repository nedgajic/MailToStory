"use client";

import type { ReactNode } from "react";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function AuthModalTrigger({
  mode,
  className,
  children,
  callbackUrl,
}: {
  mode: "login" | "signup";
  className?: string;
  children: ReactNode;
  callbackUrl?: string;
}) {
  const { openAuth } = useAuthModal();

  return (
    <button
      type="button"
      className={className}
      onClick={() => openAuth(mode, callbackUrl)}
    >
      {children}
    </button>
  );
}
