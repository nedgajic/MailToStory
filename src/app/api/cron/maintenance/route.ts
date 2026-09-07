import { NextResponse } from "next/server";
import { cronAuthorized, cronUnauthorizedResponse } from "@/lib/cron/auth";
import { runMaintenance } from "@/lib/cron/maintenance";

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return cronUnauthorizedResponse();
  }

  const result = await runMaintenance();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return GET(req);
}
