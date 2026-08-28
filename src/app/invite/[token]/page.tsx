import { MarketingShell } from "@/components/landing/marketing-shell";
import { googleAuthEnabled } from "@/lib/google-auth-enabled";
import { InviteClient } from "./invite-client";

import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Invite — ${BRAND_NAME}` };

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
