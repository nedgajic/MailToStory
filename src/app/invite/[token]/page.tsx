import { MarketingShell } from "@/components/landing/marketing-shell";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";
import { InviteClient } from "./invite-client";

export const metadata = { title: "Invite — MailToStory" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <MarketingShell showSignIn={false}>
      <InviteClient token={token} googleEnabled={googleAuthEnabled()} />
    </MarketingShell>
  );
}
