"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ tone }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      style={{
        fontSize: "0.75rem",
        padding: "0.35rem 0.65rem",
        borderRadius: "6px",
        border: dark ? "1px solid #5f6368" : "1px solid #ccc",
        background: dark ? "#303134" : "#fafafa",
        color: dark ? "#e8eaed" : "#171717",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
