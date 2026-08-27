"use client";

import { useRouter } from "next/navigation";
import DigestRenderer from "@/components/digest/DigestRenderer";
import type { Digest } from "@/lib/digest-schema";

export function StoryDetail({
  storyId,
  conversationId,
  digest,
  messageIdsInOrder,
  isFree,
}: {
  storyId: string;
  conversationId: string;
  digest: Digest;
  messageIdsInOrder: string[];
  isFree: boolean;
}) {
  const router = useRouter();

  async function onDelete() {
    const extra = isFree
      ? " Free-plan quota for this month is not refunded."
      : "";
    if (
      !window.confirm(
        `Delete this story and the forwarded mail we stored for it? This cannot be undone.${extra}`,
      )
    ) {
      return;
    }
    await fetch("/api/stories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [storyId] }),
    });
    router.push("/stories");
    router.refresh();
  }

  return (
    <div className="story-detail">
      <div className="story-detail__actions">
        <button type="button" className="home-cta dash-danger" onClick={() => void onDelete()}>
          Delete story
        </button>
      </div>
      <DigestRenderer
        digest={digest}
        threadId={conversationId}
        messageIdsInOrder={messageIdsInOrder}
      />
    </div>
  );
}
