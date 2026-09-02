"use client";

import { SessionProvider } from "next-auth/react";
import { CookieConsentProvider } from "@/components/cookie-consent/cookie-consent-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { AppToastProvider } from "@/components/ui/app-toast";

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
        <AppToastProvider>
          <CookieConsentProvider>{children}</CookieConsentProvider>
        </AppToastProvider>
      </AuthModalProvider>
    </SessionProvider>
  );
}
