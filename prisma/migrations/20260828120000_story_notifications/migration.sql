-- Story-ready email notifications + magic-link tokens

ALTER TABLE "WorkspaceMember" ADD COLUMN "notifyStoryReady" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "StoryAccessToken" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryAccessToken_token_key" ON "StoryAccessToken"("token");
CREATE INDEX "StoryAccessToken_storyId_userId_idx" ON "StoryAccessToken"("storyId", "userId");
CREATE INDEX "StoryAccessToken_expiresAt_idx" ON "StoryAccessToken"("expiresAt");
