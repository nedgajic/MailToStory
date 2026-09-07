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

function scrollToDemo() {
  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  if (signedIn) return null;

  return (
    <div className="mkt-mobile-nav__auth">
      <AuthModalTrigger mode="login" className="mkt-btn mkt-btn--ghost">
        Sign in
      </AuthModalTrigger>
      <AuthModalTrigger mode="signup" className="mkt-btn mkt-btn--cta">
        Get started
      </AuthModalTrigger>
    </div>
  );
}

export function MarketingHeroCta() {
  const { status } = useSession();
  const mounted = useMounted();
  const signedIn = mounted && status === "authenticated";

  if (signedIn) {
    return (
      <div className="mkt-hero__ctas">
        <button
          type="button"
          className="mkt-btn mkt-btn--hero mkt-btn--lg"
          onClick={scrollToDemo}
        >
          See demo
        </button>
      </div>
    );
  }

  return (
    <div className="mkt-hero__ctas">
      <AuthModalTrigger mode="signup" className="mkt-btn mkt-btn--hero mkt-btn--lg">
        Get started free
      </AuthModalTrigger>
      <button
        type="button"
        className="mkt-btn mkt-btn--outline-light mkt-btn--lg"
        onClick={scrollToDemo}
      >
        See demo
      </button>
    </div>
  );
}
