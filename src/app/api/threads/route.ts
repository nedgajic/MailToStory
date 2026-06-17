import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { listThreads } from "@/lib/gmail";
import { THREAD_LIST_PAGE_SIZE } from "@/lib/thread-list-constants";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pageToken = url.searchParams.get("pageToken") ?? undefined;

  try {
    const { threads, nextPageToken } = await listThreads(session.user.id, {
      pageToken,
      maxResults: THREAD_LIST_PAGE_SIZE,
    });
    return NextResponse.json({ threads, nextPageToken: nextPageToken ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list threads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
