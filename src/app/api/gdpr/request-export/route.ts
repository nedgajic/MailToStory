import { NextResponse } from "next/server";
import {
  exportDataByEmail,
  findRegisteredUserEmail,
} from "@/lib/gdpr/export-data";
import {
  checkGdprRateLimit,
  gdprRateLimitKey,
} from "@/lib/gdpr/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { isValidEmail, normalizeEmail } from "@/lib/password";

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
        "This email belongs to an active account. Sign in and use Settings → Privacy & data to export or delete your data.",
    });
  }

  const data = await exportDataByEmail(email);
  return NextResponse.json({ success: true, data });
}
