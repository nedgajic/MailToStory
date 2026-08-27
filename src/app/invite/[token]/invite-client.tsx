"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { useSession } from "next-auth/react";

export function InviteClient({
  token,
  googleEnabled,
}: {
  token: string;
  googleEnabled: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    const res = await fetch(`/api/invite/${token}`, { method: "POST" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not accept invite.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="auth-card">
      <h1 className="auth-card__title">Join a workspace</h1>
      {status === "authenticated" ? (
        <>
          {error ? <p className="auth-form__error">{error}</p> : null}
          <button
            className="home-cta home-cta--primary"
            type="button"
            onClick={() => void accept()}
          >
            Accept invite
          </button>
        </>
      ) : (
        <>
          <p className="auth-card__lead">
            Sign in or create an account, then accept this invite.
          </p>
          <AuthForm
            mode="login"
            googleEnabled={googleEnabled}
            callbackUrl={`/invite/${token}`}
          />
        </>
      )}
    </div>
  );
}
