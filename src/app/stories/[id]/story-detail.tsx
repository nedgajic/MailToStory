"use client";

import { useRouter } from "next/navigation";
import DigestRenderer from "@/components/digest/DigestRenderer";
import { StoryPageToolbar } from "@/components/stories/story-page-toolbar";
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
    <div className="story-page">
      <StoryPageToolbar digest={digest} onDelete={onDelete} />
      <DigestRenderer
        hideAppTopBar
        digest={digest}
        threadId={conversationId}
        messageIdsInOrder={messageIdsInOrder}
      />
    </div>
  );
}
