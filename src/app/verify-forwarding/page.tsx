import { MarketingShell } from "@/components/landing/marketing-shell";
import Link from "next/link";
import {
  scheduleReleaseQuarantineForSender,
} from "@/lib/inbound/ingest";
import { verifyForwardingAddressToken } from "@/lib/email/forwarding-address";

import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Verify forwarding address — ${BRAND_NAME}` };

export default async function VerifyForwardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; workspace?: string }>;
}) {
  const { token, workspace: workspaceId } = await searchParams;
  let ok = false;
  let email: string | null = null;
  let released = 0;

  if (token && workspaceId) {
    const verified = await verifyForwardingAddressToken({
      rawToken: token,
      workspaceId,
    });
    if (verified) {
      ok = true;
      email = verified.email;
      released = await scheduleReleaseQuarantineForSender({
        workspaceId,
        fromEmail: verified.email,
      });
    }
  }

  return (
    <MarketingShell showSignIn={false}>
      <div className="auth-card">
        <h1 className="auth-card__title">
          {ok ? "Forwarding address verified" : "Verification link invalid"}
        </h1>
        <p>
          {ok
            ? email
              ? released > 0
                ? `${email} can now forward mail to this workspace. We are processing ${released} held message${released === 1 ? "" : "s"} in the background.`
                : `${email} can now forward mail to this workspace.`
              : "This forwarding address is now active."
            : "This link is expired or already used."}
        </p>
        <p>
          <Link href="/settings/profile#forwarding">Forwarding settings</Link>
          {" · "}
          <Link href="/dashboard">Dashboard</Link>
        </p>
      </div>
    </MarketingShell>
  );
}
