"use client";

import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function ReconnectGooglePanel() {
  return (
    <div className="threads-reconnect-panel" role="alert">
      <h2 className="threads-reconnect-panel__title">Gmail connection expired</h2>
      <p className="threads-reconnect-panel__body">
        Your Google sign-in is still active, but the Gmail access token is no
        longer valid. Reconnect to load your inbox—this takes a few seconds.
      </p>
      <GoogleSignInButton
        reconnect
        className="home-cta home-cta--primary threads-reconnect-panel__cta"
      >
        Reconnect Google
      </GoogleSignInButton>
    </div>
  );
}
