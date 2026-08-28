import { NextResponse } from "next/server";
import { cleanupExpiredQuarantine } from "@/lib/inbound/quarantine";

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const header = req.headers.get("authorization")?.trim();
  if (header === `Bearer ${expected}`) return true;
  return req.headers.get("x-cron-secret") === expected;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await cleanupExpiredQuarantine();
  return NextResponse.json({ ok: true, deleted });
}

export async function POST(req: Request) {
  return GET(req);
}
