"use client";

import { AppTopBar, AppTopBarBackLink } from "@/components/app-top-bar";
import { ThreadWorkspace } from "@/components/thread/ThreadWorkspace";

export function ThreadDigestClient({ threadId }: { threadId: string }) {
  return (
    <div
      className="digest-page-shell"
      style={{ paddingTop: "var(--digest-export-bar-height)" }}
    >
      <AppTopBar contentMaxWidth="digest" startSlot={<AppTopBarBackLink />} />
      <ThreadWorkspace threadId={threadId} />
    </div>
  );
}
