import { NextResponse } from "next/server";
import { confirmGdprRequest } from "@/lib/gdpr/deletion-request";

export async function POST(req: Request) {
  let body: { token?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || body.type !== "delete") {
    return NextResponse.json({ error: "Invalid confirmation request." }, { status: 400 });
  }

  const result = await confirmGdprRequest({ rawToken: token, type: "delete" });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: result.message });
}
