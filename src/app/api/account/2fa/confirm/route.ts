import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import {
  decryptSecretFromStorage,
  generateBackupCodes,
  verifyTotpCode,
} from "@/lib/auth/totp";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim() ?? "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your authenticator app." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      email: true,
      twoFactorSecret: true,
      twoFactorEnabled: true,
    },
  });
  if (!user?.twoFactorSecret || user.twoFactorEnabled) {
    return NextResponse.json({ error: "Start setup again from your profile settings." }, { status: 400 });
  }

  const secret = decryptSecretFromStorage(user.twoFactorSecret);
  const email = user.email ?? ctx.email;
  if (!email) {
    return NextResponse.json({ error: "Account email is missing." }, { status: 400 });
  }
  if (!verifyTotpCode(secret, email, code)) {
    return NextResponse.json({ error: "That code did not match. Try again." }, { status: 400 });
  }

  const backup = await generateBackupCodes();
  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      twoFactorEnabled: true,
      twoFactorConfirmedAt: new Date(),
      twoFactorBackupCodes: backup.hashedJson,
    },
  });

  return NextResponse.json({
    ok: true,
    backupCodes: backup.plain,
  });
}
