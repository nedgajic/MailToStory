import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { hashToken, newRawToken } from "@/lib/workspace";
import { appUrl, sendVerifyEmail } from "@/lib/email/send";
import { getWorkspaceContext } from "@/lib/session";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx?.email) {
    return NextResponse.json({ error: "No email on this account." }, { status: 400 });
  }
  if (ctx.emailVerified) {
    return NextResponse.json({ ok: true, already: true });
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: `verify:${ctx.email}` },
  });
  const raw = newRawToken();
  await prisma.verificationToken.create({
    data: {
      identifier: `verify:${ctx.email}`,
      token: hashToken(raw),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerifyEmail(ctx.email, appUrl(`/verify-email?token=${raw}`));
  return NextResponse.json({ ok: true });
}
