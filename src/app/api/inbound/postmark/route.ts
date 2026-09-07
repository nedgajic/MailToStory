import { NextRequest, NextResponse } from "next/server";
import { readBasicAuth } from "@/lib/session";
import { ingestPostmarkPayload } from "@/lib/inbound/ingest";
import type { PostmarkInboundPayload } from "@/lib/inbound/postmark";

function inboundAuthConfigured(): boolean {
  return Boolean(
    process.env.POSTMARK_INBOUND_BASIC_USER?.trim() &&
      process.env.POSTMARK_INBOUND_BASIC_PASSWORD?.trim(),
  );
}

function requireInboundAuthInProduction(): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (inboundAuthConfigured()) return null;

  console.error(
    "[inbound] POSTMARK_INBOUND_BASIC_USER/PASSWORD missing in production — rejecting webhook",
  );
  return NextResponse.json(
    { error: "Inbound webhook auth is not configured." },
    { status: 503 },
  );
}

function verifyInboundAuth(req: NextRequest): boolean {
  const expectedUser = process.env.POSTMARK_INBOUND_BASIC_USER?.trim();
  const expectedPass = process.env.POSTMARK_INBOUND_BASIC_PASSWORD?.trim();
  const extraToken = process.env.POSTMARK_WEBHOOK_TOKEN?.trim();

  if (expectedUser && expectedPass) {
    const basic = readBasicAuth(req);
    if (!basic || basic.user !== expectedUser || basic.password !== expectedPass) {
      return false;
    }
    return true;
  }

  if (extraToken) {
    const header =
      req.headers.get("x-postmark-webhook-token") ||
      req.headers.get("x-webhook-token");
    return header === extraToken;
  }

  return process.env.NODE_ENV !== "production";
}

export async function POST(req: NextRequest) {
  const productionBlock = requireInboundAuthInProduction();
  if (productionBlock) return productionBlock;

  if (!verifyInboundAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
