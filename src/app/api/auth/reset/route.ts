import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { hashToken } from "@/lib/workspace";

export async function POST(req: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = body.token?.trim() ?? "";
  const passwordError = validatePassword(body.password ?? "");
  if (!token || passwordError) {
    return NextResponse.json(
      { error: passwordError || "Invalid reset link." },
      { status: 400 },
    );
  }

  const hashed = hashToken(token);
  const row = await prisma.verificationToken.findFirst({
    where: { token: hashed, expires: { gt: new Date() } },
  });
  if (!row?.identifier.startsWith("reset:")) {
    return NextResponse.json(
      { error: "This reset link is invalid or expired." },
      { status: 400 },
    );
  }
  const email = row.identifier.slice("reset:".length);
  const passwordHash = await hashPassword(body.password!);
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      credentialsChangedAt: new Date(),
    },
  });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: row.identifier, token: row.token } },
  });
  return NextResponse.json({ ok: true });
}
