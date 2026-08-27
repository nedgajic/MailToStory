"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
      <div className="mkt-header__auth">
        <Link href="/dashboard" className="mkt-btn mkt-btn--cta">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mkt-header__auth">
      <Link href="/login" className="mkt-btn mkt-btn--ghost">
        Sign in
      </Link>
      <Link href="/signup" className="mkt-btn mkt-btn--cta">
        Get started
      </Link>
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
      <Link href="/login" className="mkt-btn mkt-btn--ghost">
        Sign in
      </Link>
      <Link href="/signup" className="mkt-btn mkt-btn--cta">
        Get started
      </Link>
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
      <Link href="/signup" className="mkt-btn mkt-btn--hero mkt-btn--lg">
        Get started free
      </Link>
      {googleEnabled ? (
        <Link href="/login" className="mkt-btn mkt-btn--outline-light mkt-btn--lg">
          Sign in with Google
        </Link>
      ) : null}
    </div>
  );
}
