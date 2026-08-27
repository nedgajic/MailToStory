import { NextRequest, NextResponse } from "next/server";
import { readBasicAuth } from "@/lib/session";
import { ingestPostmarkPayload } from "@/lib/inbound/ingest";
import type { PostmarkInboundPayload } from "@/lib/inbound/postmark";

export async function POST(req: NextRequest) {
  const expectedUser = process.env.POSTMARK_INBOUND_BASIC_USER?.trim();
  const expectedPass = process.env.POSTMARK_INBOUND_BASIC_PASSWORD?.trim();
  const extraToken = process.env.POSTMARK_WEBHOOK_TOKEN?.trim();

  if (expectedUser && expectedPass) {
    const basic = readBasicAuth(req);
    if (!basic || basic.user !== expectedUser || basic.password !== expectedPass) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (extraToken) {
    const header =
      req.headers.get("x-postmark-webhook-token") ||
      req.headers.get("x-webhook-token");
    if (header !== extraToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: PostmarkInboundPayload;
  try {
    payload = (await req.json()) as PostmarkInboundPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await ingestPostmarkPayload(payload);
  return NextResponse.json(result);
}
