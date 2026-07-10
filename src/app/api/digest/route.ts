import { authOptions } from "@/auth";
import { buildDigestPrompt } from "@/lib/buildDigestPrompt";
import {
  generateDigestFromPrompt,
  streamGenerateDigestFromPrompt,
} from "@/lib/gemini";
import { getThreadFull } from "@/lib/gmail";
import { preprocessThread } from "@/lib/preprocessThread";
import {
  getCachedThreadDigest,
  saveThreadDigest,
} from "@/lib/threadDigestCache";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { formatUserFacingError } from "@/lib/user-facing-error";

function sseChunk(data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { threadId?: string; stream?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const threadId = body.threadId;
  if (!threadId || typeof threadId !== "string") {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }

  const useStream = body.stream !== false;

  if (!useStream) {
    const cached = await getCachedThreadDigest(session.user.id, threadId);
    if (cached) {
      return NextResponse.json({
        digest: cached.digest,
        messageIdsInOrder: cached.messageIdsInOrder,
      });
    }
    try {
      const thread = await getThreadFull(session.user.id, threadId);
      const { cleanedThread, attachmentManifest, metadata } =
        preprocessThread(thread);
      const prompt = buildDigestPrompt(
        cleanedThread,
        attachmentManifest,
        metadata,
      );
      const digest = await generateDigestFromPrompt(prompt);
      const messageIdsInOrder = (thread.messages ?? []).map(
        (m) => m.id ?? "",
      );
      try {
        await saveThreadDigest(
          session.user.id,
          threadId,
          digest,
          messageIdsInOrder,
        );
      } catch (saveErr) {
        console.error("thread digest cache save failed:", saveErr);
      }
      return NextResponse.json({ digest, messageIdsInOrder });
    } catch (e) {
      console.error("digest error:", e);
      const friendly = formatUserFacingError(
        e instanceof Error ? e.message : "Failed to generate story",
      );
      return NextResponse.json(
        { error: friendly.message, ...friendly },
        { status: 502 },
      );
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(sseChunk(data));
        } catch {
          /* stream may be closed */
        }
      };

      try {
        const cached = await getCachedThreadDigest(
          session.user.id,
          threadId,
        );
        if (cached) {
          send({
            type: "step_done",
            label: "Using saved story for this thread",
          });
          send({
            type: "done",
            digest: cached.digest,
            messageIdsInOrder: cached.messageIdsInOrder,
          });
          return;
        }

        const thread = await getThreadFull(session.user.id, threadId);
        send({
          type: "step_done",
          label: "Loaded conversation from Gmail",
        });

        const { cleanedThread, attachmentManifest, metadata } =
          preprocessThread(thread);
        const prompt = buildDigestPrompt(
          cleanedThread,
          attachmentManifest,
          metadata,
        );
        send({ type: "step_done", label: "Prepared prompt for the model" });

        send({
          type: "working",
          label:
            "Generating story (this can take a little while for long threads)…",
          chars: 0,
        });

        let lastEmit = 0;
        const digest = await streamGenerateDigestFromPrompt(
          prompt,
          (accumulated) => {
            const now = Date.now();
            if (now - lastEmit < 350 && accumulated.length >= 200) return;
            lastEmit = now;
            send({ type: "progress", chars: accumulated.length });
          },
        );

        const messageIdsInOrder = (thread.messages ?? []).map(
          (m) => m.id ?? "",
        );
        try {
          await saveThreadDigest(
            session.user.id,
            threadId,
            digest,
            messageIdsInOrder,
          );
        } catch (saveErr) {
          console.error("thread digest cache save failed:", saveErr);
        }
        send({ type: "done", digest, messageIdsInOrder });
      } catch (e) {
        console.error("digest stream error:", e);
        send({
          type: "error",
          ...formatUserFacingError(
            e instanceof Error ? e.message : "Failed to generate story",
          ),
        });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
