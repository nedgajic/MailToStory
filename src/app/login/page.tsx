import { MarketingShell } from "@/components/landing/marketing-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";

export const metadata = { title: "Sign in — MailToStory" };

export default function LoginPage() {
  return (
    <MarketingShell showSignIn={false}>
      <AuthForm mode="login" googleEnabled={googleAuthEnabled()} />
    </MarketingShell>
  );
}
