import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext } from "@/lib/session";
import prisma from "@/lib/prisma";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/password";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newPassword = body.newPassword ?? "";
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.passwordHash) {
    const current = body.currentPassword ?? "";
    if (!(await verifyPassword(current, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (await verifyPassword(newPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "Choose a new password that is different from your current one." },
        { status: 400 },
      );
    }
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      passwordHash,
      credentialsChangedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    reauth: true,
    message: user.passwordHash
      ? "Password updated. Sign in again on your other devices."
      : "Password set. You can now sign in with email and password.",
  });
}
