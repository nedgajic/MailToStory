-- AlterTable
ALTER TABLE "Story" ADD COLUMN "sourceMessages" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "StoryVersion" ADD COLUMN "sourceMessages" JSONB NOT NULL DEFAULT '[]';
