"use client";

import { SessionProvider } from "next-auth/react";
import { CookieConsentProvider } from "@/components/cookie-consent/cookie-consent-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";

export function Providers({
  children,
  googleEnabled = false,
}: {
  children: React.ReactNode;
  googleEnabled?: boolean;
}) {
  return (
    <SessionProvider>
      <AuthModalProvider googleEnabled={googleEnabled}>
        <CookieConsentProvider>{children}</CookieConsentProvider>
      </AuthModalProvider>
    </SessionProvider>
  );
}
