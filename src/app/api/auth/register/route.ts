import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from "@/lib/password";
import { ensureWorkspaceForUser, hashToken, newRawToken } from "@/lib/workspace";
import { appUrl, sendVerifyEmail } from "@/lib/email/send";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim() || null;
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });
  await ensureWorkspaceForUser({
    userId: user.id,
    name,
    email,
  });

  const raw = newRawToken();
  await prisma.verificationToken.create({
    data: {
      identifier: `verify:${email}`,
      token: hashToken(raw),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  try {
    await sendVerifyEmail(email, appUrl(`/verify-email?token=${raw}`));
  } catch (error) {
    console.error("[register] verify email failed", error);
  }

  return NextResponse.json({ ok: true, email });
}
