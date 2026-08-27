"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type MarketingNavActionsProps = {
  showSignIn?: boolean;
};

export function MarketingNavActions({
  showSignIn = true,
}: MarketingNavActionsProps) {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const signedIn = mounted && status === "authenticated";

  return (
    <div className="home-nav__actions">
      <ThemeToggle />
      {showSignIn ? (
        mounted ? (
          signedIn ? (
            <Link href="/dashboard" className="home-nav__signin">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="home-nav__signin">
              Sign in
            </Link>
          )
        ) : (
          <span
            className="home-nav__signin home-nav__signin--placeholder"
            aria-hidden="true"
          />
        )
      ) : null}
    </div>
  );
}
