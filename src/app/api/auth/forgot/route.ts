import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/password";
import { hashToken, newRawToken } from "@/lib/workspace";
import { appUrl, sendResetEmail } from "@/lib/email/send";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { clientIp } from "@/lib/client-ip";

const FORGOT_WINDOW_MS = 60 * 60 * 1000;
const FORGOT_MAX = 10;

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = normalizeEmail(body.email ?? "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: true });
  }

  if (
    !(await checkAuthRateLimit(
      `forgot:ip:${clientIp(req)}`,
      FORGOT_MAX,
      FORGOT_WINDOW_MS,
    ))
  ) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${email}` },
    });
    const raw = newRawToken();
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token: hashToken(raw),
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    try {
      await sendResetEmail(email, appUrl(`/reset-password?token=${raw}`));
    } catch (error) {
      console.error("[forgot] send failed", error);
    }
  }
  return NextResponse.json({ ok: true });
}
