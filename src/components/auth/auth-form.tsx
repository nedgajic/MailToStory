"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { nextAuthErrorMessage } from "@/lib/auth-errors";
import { BRAND_PRIVACY_PATH, BRAND_TERMS_PATH } from "@/lib/brand";

export function AuthForm({
  mode,
  googleEnabled,
  callbackUrl = "/dashboard",
  authError,
  twoFactorToken,
  variant = "page",
  onSwitchMode,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
  callbackUrl?: string;
  authError?: string | null;
  twoFactorToken?: string | null;
  variant?: "page" | "modal";
  onSwitchMode?: (mode: "login" | "signup") => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isModal = variant === "modal";

  useEffect(() => {
    setError(nextAuthErrorMessage(authError));
  }, [authError]);

  async function completeOAuthTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFactorToken) return;
    setError(null);
    setBusy(true);
    try {
      const result = await signIn("credentials", {
        twoFactorLoginToken: twoFactorToken,
        totpCode,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError("Incorrect authentication code.");
        return;
      }
      window.location.href = callbackUrl;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && !privacyConsent) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, privacyConsent: true }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error || "Could not create account.");
          return;
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        totpCode: needsTotp ? totpCode : undefined,
        redirect: false,
        callbackUrl,
      });
      if (result?.error === "TwoFactorRequired") {
        setNeedsTotp(true);
        setError("Enter the 6-digit code from your authenticator app.");
        return;
      }
      if (result?.error) {
        setError(
          needsTotp
            ? "Incorrect authentication code."
            : mode === "login"
              ? "Incorrect email or password."
              : "If you already have an account, sign in. Otherwise check your email for a verification link.",
        );
        return;
      }
      window.location.href = callbackUrl;
    } finally {
      setBusy(false);
    }
  }

  if (twoFactorToken && mode === "login") {
    const twoFactorBody = (
      <form className={isModal ? "auth-modal-form" : "auth-form"} onSubmit={(e) => void completeOAuthTwoFactor(e)}>
        <label className={isModal ? "auth-modal-form__field" : "auth-form__field"}>
          Authentication code
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            required
            placeholder="6-digit code"
            autoFocus
          />
        </label>
        {error ? (
          <p className={isModal ? "auth-modal-form__error" : "auth-form__error"}>{error}</p>
        ) : null}
        <button
          className={isModal ? "auth-modal-form__submit" : "home-cta home-cta--primary"}
          type="submit"
          disabled={busy}
        >
          {busy ? "Verifying…" : "Continue"}
        </button>
      </form>
    );

    if (isModal) {
      return (
        <>
          <p className="auth-modal-form__kicker">Almost there</p>
          <h2 className="auth-modal-form__title" id="authModalTitle">
            Two-factor authentication
          </h2>
          <p className="auth-modal-form__lead">
            Enter the 6-digit code from your authenticator app to finish signing in.
          </p>
          {twoFactorBody}
        </>
      );
    }

    return (
      <div className="auth-card">
        <h1 className="auth-card__title">Two-factor authentication</h1>
        <p className="auth-card__lead">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </p>
        {twoFactorBody}
      </div>
    );
  }

  if (isModal) {
    return (
      <>
        <p className="auth-modal-form__kicker">
          {mode === "login" ? "Welcome back" : "Get started"}
        </p>
        <h2 className="auth-modal-form__title" id="authModalTitle">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h2>
        <p className="auth-modal-form__lead">
          {mode === "login"
            ? "Use email and password, or continue with Google."
            : "Any email works. We never connect to your inbox."}
        </p>
        {googleEnabled ? (
          <>
            <GoogleSignInButton
              className="auth-modal-form__google"
              callbackUrl={callbackUrl}
            >
              Continue with Google
            </GoogleSignInButton>
            <p className="auth-modal-form__divider">or continue with email</p>
          </>
        ) : null}
        <form className="auth-modal-form" onSubmit={(e) => void onSubmit(e)}>
          {mode === "signup" ? (
            <label className="auth-modal-form__field">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          ) : null}
          <label className="auth-modal-form__field">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@company.com"
            />
          </label>
          <label className="auth-modal-form__field">
            Password
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="At least 10 characters"
            />
          </label>
          {mode === "signup" ? (
            <label className="auth-modal-form__field">
              Confirm password
              <input
                type="password"
                required
                minLength={10}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
              />
            </label>
          ) : null}
          {mode === "login" && needsTotp ? (
            <label className="auth-modal-form__field">
              Authentication code
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                required
                placeholder="6-digit code"
              />
            </label>
          ) : null}
          {mode === "signup" ? (
            <label className="auth-modal-form__checkbox">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                required
              />
              <span>
                I agree to the{" "}
                <Link href={BRAND_TERMS_PATH}>Terms of Service</Link> and{" "}
                <Link href={BRAND_PRIVACY_PATH}>Privacy Policy</Link>.
              </span>
            </label>
          ) : null}
          {error ? <p className="auth-modal-form__error">{error}</p> : null}
          <button className="auth-modal-form__submit" type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        {mode === "login" ? (
          <p className="auth-modal-form__foot">
            <Link href="/forgot-password">Forgot password?</Link>
            <span> · </span>
            {onSwitchMode ? (
              <button type="button" onClick={() => onSwitchMode("signup")}>
                Create an account
              </button>
            ) : (
              <Link href="/signup">Create an account</Link>
            )}
          </p>
        ) : (
          <p className="auth-modal-form__foot">
            Already have an account?{" "}
            {onSwitchMode ? (
              <button type="button" onClick={() => onSwitchMode("login")}>
                Sign in
              </button>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-card__title">
        {mode === "login" ? "Sign in" : "Create your account"}
      </h1>
      <p className="auth-card__lead">
        {mode === "login"
          ? "Use email and password, or continue with Google."
          : "Any email works. We never connect to your inbox."}
      </p>
      {googleEnabled ? (
        <>
          <GoogleSignInButton className="home-cta home-cta--primary auth-card__google">
            Continue with Google
          </GoogleSignInButton>
          <p className="auth-card__or">or</p>
        </>
      ) : null}
      <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
        {mode === "signup" ? (
          <label className="auth-form__field">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="auth-form__field">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="auth-form__field">
          Password
          <input
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {mode === "signup" ? (
          <label className="auth-form__field">
            Confirm password
            <input
              type="password"
              required
              minLength={10}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        ) : null}
        {mode === "login" && needsTotp ? (
          <label className="auth-form__field">
            Authentication code
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              required
            />
          </label>
        ) : null}
        {mode === "signup" ? (
          <label className="auth-form__checkbox">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              required
            />
            <span>
              I agree to the{" "}
              <Link href={BRAND_TERMS_PATH}>Terms of Service</Link> and{" "}
              <Link href={BRAND_PRIVACY_PATH}>Privacy Policy</Link>.
            </span>
          </label>
        ) : null}
        {error ? <p className="auth-form__error">{error}</p> : null}
        <button className="home-cta home-cta--primary" type="submit" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
      {mode === "login" ? (
        <p className="auth-card__foot">
          <Link href="/forgot-password">Forgot password?</Link>
          <span> · </span>
          <Link href="/signup">Create an account</Link>
        </p>
      ) : (
        <p className="auth-card__foot">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      )}
    </div>
  );
}
