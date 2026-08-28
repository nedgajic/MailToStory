import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { consumeStoryAccessToken } from "@/lib/email/story-access-token";
import { appUrl } from "@/lib/email/send";

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawToken = url.searchParams.get("token")?.trim();
  if (!rawToken) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", appUrl("")));
  }

  const access = await consumeStoryAccessToken(rawToken);
  if (!access) {
    return NextResponse.redirect(new URL("/login?error=expired_link", appUrl("")));
  }

  const user = await prisma.user.findUnique({
    where: { id: access.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", appUrl("")));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { activeWorkspaceId: access.workspaceId },
  });

  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    return NextResponse.redirect(new URL("/login?error=server", appUrl("")));
  }

  const sessionToken = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    secret,
    maxAge: 30 * 24 * 60 * 60,
  });

  const redirectUrl = new URL(`/stories/${access.storyId}`, appUrl(""));
  const response = NextResponse.redirect(redirectUrl);
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: sessionCookieName(),
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
