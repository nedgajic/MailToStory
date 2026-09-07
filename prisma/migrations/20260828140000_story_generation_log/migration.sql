-- Track AI story generations for rate limiting and fair-use caps.
CREATE TABLE "StoryGenerationLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryGenerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoryGenerationLog_workspaceId_createdAt_idx" ON "StoryGenerationLog"("workspaceId", "createdAt");
CREATE INDEX "StoryGenerationLog_conversationId_createdAt_idx" ON "StoryGenerationLog"("conversationId", "createdAt");
