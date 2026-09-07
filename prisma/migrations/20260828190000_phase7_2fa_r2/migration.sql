-- Phase 7: 2FA and attachment storage backend
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorConfirmedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT;

ALTER TABLE "ConversationAttachment" ADD COLUMN "storageBackend" TEXT NOT NULL DEFAULT 'local';
