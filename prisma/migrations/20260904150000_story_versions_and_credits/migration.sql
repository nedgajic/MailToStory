-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "defaultStoryLength" TEXT NOT NULL DEFAULT 'normal';

-- AlterTable
ALTER TABLE "Story" ADD COLUMN "activeVersionId" TEXT;

-- AlterTable
ALTER TABLE "StoryGenerationLog" ADD COLUMN "creditCost" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "StoryVersion" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolutionSummary" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "digest" JSONB NOT NULL,
    "messageIdsInOrder" JSONB NOT NULL,
    "storyLength" TEXT NOT NULL DEFAULT 'normal',
    "creditCost" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryVersion_pkey" PRIMARY KEY ("id")
);

-- Backfill versions from existing stories
INSERT INTO "StoryVersion" (
    "id",
    "storyId",
    "versionNumber",
    "title",
    "status",
    "resolutionSummary",
    "searchText",
    "digest",
    "messageIdsInOrder",
    "storyLength",
    "creditCost",
    "createdAt"
)
SELECT
    'sv_' || s."id" || '_v1',
    s."id",
    1,
    s."title",
    s."status",
    s."resolutionSummary",
    s."searchText",
    s."digest",
    s."messageIdsInOrder",
    s."storyLength",
    10,
    s."createdAt"
FROM "Story" s;

-- Point stories at their v1 row
UPDATE "Story" s
SET "activeVersionId" = v."id"
FROM "StoryVersion" v
WHERE v."storyId" = s."id" AND v."versionNumber" = 1;

-- CreateIndex
CREATE UNIQUE INDEX "Story_activeVersionId_key" ON "Story"("activeVersionId");

-- CreateIndex
CREATE INDEX "StoryVersion_storyId_createdAt_idx" ON "StoryVersion"("storyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoryVersion_storyId_versionNumber_key" ON "StoryVersion"("storyId", "versionNumber");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "StoryVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryVersion" ADD CONSTRAINT "StoryVersion_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
