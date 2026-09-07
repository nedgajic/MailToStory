import { NextResponse } from "next/server";
import {
  deleteDataByEmail,
  findRegisteredUserEmail,
} from "@/lib/gdpr/export-data";
import { createDeletionRequest } from "@/lib/gdpr/deletion-request";
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
        "This email belongs to an active account. Sign in and use Settings → Privacy & data to delete your account and data.",
    });
  }

  try {
    await createDeletionRequest(email);
  } catch (error) {
    console.error("[gdpr] deletion request email failed", error);
    return NextResponse.json(
      { error: "Could not send the confirmation email. Try again later." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    message:
      "If we have data for this email, we sent a confirmation link. Open it within 24 hours to complete deletion.",
  });
}
