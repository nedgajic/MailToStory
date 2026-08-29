"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AppUserMenu } from "@/components/app-user-menu";
import { AuthModalTrigger } from "@/components/auth/auth-modal-trigger";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function MarketingHeaderAuth() {
  const { status } = useSession();
  const mounted = useMounted();
  const signedIn = mounted && status === "authenticated";

  if (signedIn) {
    return (
      <div className="mkt-header__auth mkt-header__auth--signed-in">
        <Link href="/dashboard" className="mkt-btn mkt-btn--ghost">
          Dashboard
        </Link>
        <AppUserMenu triggerClassName="app-top-bar__user-trigger--shell" />
      </div>
    );
  }

  return (
    <div className="mkt-header__auth">
      <AuthModalTrigger mode="login" className="mkt-btn mkt-btn--ghost">
        Sign in
      </AuthModalTrigger>
      <AuthModalTrigger mode="signup" className="mkt-btn mkt-btn--cta">
        Get started
      </AuthModalTrigger>
    </div>
  );
}

export function MarketingMobileNavAuth() {
  const { status } = useSession();
  const mounted = useMounted();
  const signedIn = mounted && status === "authenticated";

  if (signedIn) {
    return (
      <div className="mkt-header__auth">
        <Link href="/dashboard" className="mkt-btn mkt-btn--cta">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mkt-header__auth">
      <AuthModalTrigger mode="login" className="mkt-btn mkt-btn--ghost">
        Sign in
      </AuthModalTrigger>
      <AuthModalTrigger mode="signup" className="mkt-btn mkt-btn--cta">
        Get started
      </AuthModalTrigger>
    </div>
  );
}

export function MarketingHeroCta({ googleEnabled }: { googleEnabled: boolean }) {
  const { status } = useSession();
  const mounted = useMounted();
  const signedIn = mounted && status === "authenticated";

  if (signedIn) {
    return (
      <div className="mkt-hero__ctas">
        <Link href="/dashboard" className="mkt-btn mkt-btn--hero mkt-btn--lg">
          Open dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mkt-hero__ctas">
      <AuthModalTrigger mode="signup" className="mkt-btn mkt-btn--hero mkt-btn--lg">
        Get started free
      </AuthModalTrigger>
      {googleEnabled ? (
        <AuthModalTrigger mode="login" className="mkt-btn mkt-btn--outline-light mkt-btn--lg">
          Sign in with Google
        </AuthModalTrigger>
      ) : null}
    </div>
  );
}
