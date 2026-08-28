import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { normalizeEmail } from "@/lib/password";

const handler = NextAuth(authOptions);

async function readCredentialsEmail(req: Request): Promise<string | null> {
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await req.clone().json()) as { email?: string };
      return normalizeEmail(body.email ?? "") || null;
    }
    const form = await req.clone().formData();
    return normalizeEmail(String(form.get("email") ?? "")) || null;
  } catch {
    return null;
  }
}

async function withLoginRateLimit(req: Request, context?: unknown) {
  const url = new URL(req.url);
  if (
    req.method === "POST" &&
    url.pathname.endsWith("/callback/credentials")
  ) {
    const email = await readCredentialsEmail(req);
    if (
      email &&
      !(await checkLoginRateLimit({ ip: clientIp(req), email }))
    ) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again later." },
        { status: 429 },
      );
    }
  }

  return handler(req, context as never);
}

export { withLoginRateLimit as GET, withLoginRateLimit as POST };
