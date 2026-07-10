"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type GoogleSignInButtonProps = {
  className?: string;
  children: React.ReactNode;
  /** Clear stale Google tokens before OAuth (fixes invalid_grant). */
  reconnect?: boolean;
};

export function GoogleSignInButton({
  className,
  children,
  reconnect = false,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          try {
            if (reconnect) {
              await fetch("/api/auth/reconnect-google", { method: "POST" });
            }
            await signIn("google", { callbackUrl: "/threads" });
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      {children}
    </button>
  );
}
