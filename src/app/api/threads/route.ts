import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { listThreads } from "@/lib/gmail";
import { DEFAULT_THREADS_ONLY, minMessagesForThreadsOnly, THREAD_LIST_PAGE_SIZE } from "@/lib/thread-list-constants";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pageToken = url.searchParams.get("pageToken") ?? undefined;
  const minMessages = Math.max(
    1,
    parseInt(
      url.searchParams.get("minMessages") ??
        String(minMessagesForThreadsOnly(DEFAULT_THREADS_ONLY)),
      10,
    ) || minMessagesForThreadsOnly(DEFAULT_THREADS_ONLY),
  );

  try {
    const { threads, nextPageToken } = await listThreads(session.user.id, {
      pageToken,
      maxResults: THREAD_LIST_PAGE_SIZE,
      minMessages,
      ownerEmail: session.user.email ?? undefined,
    });
    return NextResponse.json({
      threads,
      nextPageToken: nextPageToken ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list threads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
