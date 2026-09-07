"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type GoogleSignInButtonProps = {
  className?: string;
  children: React.ReactNode;
  callbackUrl?: string;
};

export function GoogleSignInButton({
  className,
  children,
  callbackUrl = "/dashboard",
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
            await signIn("google", { callbackUrl });
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
