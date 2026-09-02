-- Story soft delete: 30-day Recently deleted retention before permanent purge.
ALTER TABLE "Story" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Story" ADD COLUMN "purgeAt" TIMESTAMP(3);
ALTER TABLE "Story" ADD COLUMN "deletedById" TEXT;

CREATE INDEX "Story_workspaceId_deletedAt_idx" ON "Story"("workspaceId", "deletedAt");
CREATE INDEX "Story_purgeAt_idx" ON "Story"("purgeAt");
