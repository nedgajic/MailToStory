import { MarketingShell } from "@/components/landing/marketing-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";

export const metadata = { title: "Sign up — MailToStory" };

export default function SignupPage() {
  return (
    <MarketingShell showSignIn={false}>
      <AuthForm mode="signup" googleEnabled={googleAuthEnabled()} />
    </MarketingShell>
  );
}
