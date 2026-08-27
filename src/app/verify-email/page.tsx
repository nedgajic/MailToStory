import { MarketingShell } from "@/components/landing/marketing-shell";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/workspace";
import Link from "next/link";

export const metadata = { title: "Verify email — MailToStory" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let ok = false;
  if (token) {
    const hashed = hashToken(token);
    const row = await prisma.verificationToken.findFirst({
      where: { token: hashed, expires: { gt: new Date() } },
    });
    if (row?.identifier.startsWith("verify:")) {
      const email = row.identifier.slice("verify:".length);
      await prisma.user.updateMany({
        where: { email },
        data: { emailVerified: new Date() },
      });
      await prisma.verificationToken.deleteMany({
        where: { identifier: row.identifier },
      });
      ok = true;
    }
  }

  return (
    <MarketingShell showSignIn={false}>
      <div className="auth-card">
        <h1 className="auth-card__title">
          {ok ? "Email verified" : "Verification link invalid"}
        </h1>
        <p>
          {ok
            ? "Your inbound address is now active."
            : "This link is expired or already used."}
        </p>
        <p>
          <Link href="/dashboard">Go to dashboard</Link>
        </p>
      </div>
    </MarketingShell>
  );
}
