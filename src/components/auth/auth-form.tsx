"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { BRAND_PRIVACY_PATH, BRAND_TERMS_PATH } from "@/lib/brand";

export function AuthForm({
  mode,
  googleEnabled,
  callbackUrl = "/dashboard",
  variant = "page",
  onSwitchMode,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
  callbackUrl?: string;
  variant?: "page" | "modal";
  onSwitchMode?: (mode: "login" | "signup") => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isModal = variant === "modal";

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
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError(
          mode === "login"
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
