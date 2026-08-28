import { NextResponse } from "next/server";
import {
  deleteDataByEmail,
  findRegisteredUserEmail,
} from "@/lib/gdpr/export-data";
import {
  checkGdprRateLimit,
  gdprRateLimitKey,
} from "@/lib/gdpr/rate-limit";
import { isValidEmail, normalizeEmail } from "@/lib/password";

function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const rateKey = gdprRateLimitKey(email, clientIp(req));
  if (!checkGdprRateLimit(rateKey)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 },
    );
  }

  if (await findRegisteredUserEmail(email)) {
    return NextResponse.json({
      signInRequired: true,
      message:
        "This email belongs to an active account. Sign in and use Settings → Profile to delete your account and data.",
    });
  }

  const removed = await deleteDataByEmail(email);
  return NextResponse.json({
    success: true,
    message:
      removed > 0
        ? "Matching records have been deleted."
        : "No matching records were found for this email.",
  });
}
