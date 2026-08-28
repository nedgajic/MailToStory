import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyLoginTotp } from "@/lib/auth/totp";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      email: true,
      passwordHash: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  });
  if (!user?.passwordHash || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "Two-factor authentication is not enabled." }, { status: 400 });
  }
  if (!(await verifyPassword(body.currentPassword ?? "", user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const email = user.email ?? ctx.email;
  if (!email) {
    return NextResponse.json({ error: "Account email is missing." }, { status: 400 });
  }

  const verification = await verifyLoginTotp({
    email,
    encryptedSecret: user.twoFactorSecret,
    backupCodesJson: user.twoFactorBackupCodes,
    code: body.code ?? "",
  });
  if (!verification.ok) {
    return NextResponse.json({ error: "Invalid authentication code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfirmedAt: null,
      twoFactorBackupCodes: null,
      credentialsChangedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    reauth: true,
    message: "Two-factor authentication disabled. Sign in again on your other devices.",
  });
}
