import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import QRCode from "qrcode";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  buildTotpUri,
  encryptSecretForStorage,
  generateTotpSecret,
} from "@/lib/auth/totp";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string };
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
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled." }, { status: 400 });
  }
  if (user.passwordHash) {
    if (!(await verifyPassword(body.currentPassword ?? "", user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }

  const secret = generateTotpSecret();
  const email = user.email ?? ctx.email;
  if (!email) {
    return NextResponse.json({ error: "Account email is missing." }, { status: 400 });
  }
  const otpauthUrl = buildTotpUri(email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      twoFactorSecret: encryptSecretForStorage(secret),
      twoFactorEnabled: false,
      twoFactorConfirmedAt: null,
      twoFactorBackupCodes: null,
    },
  });

  return NextResponse.json({
    ok: true,
    otpauthUrl,
    qrCodeDataUrl,
    manualKey: secret,
  });
}
