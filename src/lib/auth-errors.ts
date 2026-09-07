const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Callback:
    "Sign-in could not be completed. Try again, or use email and password.",
  OAuthAccountNotLinked:
    "That Google account uses a different email. Sign in with email and password first, then link Google in settings.",
  OAuthSignin: "Could not start Google sign-in. Try again in a moment.",
  OAuthCallback: "Google sign-in failed. Try again, or use email and password.",
  CredentialsSignin: "Incorrect email or password.",
  SessionRequired: "Please sign in to continue.",
};

export function nextAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}
