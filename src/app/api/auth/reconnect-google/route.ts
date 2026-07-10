import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { clearGoogleAccountLink } from "@/lib/google-account";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearGoogleAccountLink(session.user.id);
  return NextResponse.json({ ok: true });
}
