import { NextResponse } from "next/server";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron/auth";
import { cleanupExpiredQuarantine } from "@/lib/inbound/quarantine";

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return cronUnauthorizedResponse();
  }

  const deleted = await cleanupExpiredQuarantine();
  return NextResponse.json({ ok: true, deleted });
}

export async function POST(req: Request) {
  return GET(req);
}
