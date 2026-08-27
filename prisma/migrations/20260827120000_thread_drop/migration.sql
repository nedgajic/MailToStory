-- DropForeignKey
ALTER TABLE "ThreadDigest" DROP CONSTRAINT "ThreadDigest_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeWorkspaceId" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- DropTable
DROP TABLE "ThreadDigest";

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "inboundLocalPart" TEXT NOT NULL,
    "seatQuantity" INTEGER NOT NULL DEFAULT 1,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodEnd" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceInvite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '(no subject)',
    "snippet" TEXT NOT NULL DEFAULT '',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT '',
    "fromEmail" TEXT NOT NULL DEFAULT '',
    "toAddresses" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL,
    "textBody" TEXT NOT NULL,
    "htmlBody" TEXT,
    "headersJson" JSONB,
    "postmarkMessageId" TEXT,
    "inReplyTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationAttachment" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,

    CONSTRAINT "ConversationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "resolutionSummary" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "digest" JSONB NOT NULL,
    "messageIdsInOrder" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_inboundLocalPart_key" ON "Workspace"("inboundLocalPart");

-- CreateIndex
CREATE INDEX "Workspace_stripeCustomerId_idx" ON "Workspace"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Workspace_stripeSubscriptionId_idx" ON "Workspace"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_workspaceId_email_idx" ON "WorkspaceInvite"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "Conversation_workspaceId_lastMessageAt_idx" ON "Conversation"("workspaceId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMessage_postmarkMessageId_key" ON "ConversationMessage"("postmarkMessageId");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_sequence_idx" ON "ConversationMessage"("conversationId", "sequence");

-- CreateIndex
CREATE INDEX "ConversationAttachment_conversationId_messageId_idx" ON "ConversationAttachment"("conversationId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_conversationId_key" ON "Story"("conversationId");

-- CreateIndex
CREATE INDEX "Story_workspaceId_createdAt_idx" ON "Story"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationAttachment" ADD CONSTRAINT "ConversationAttachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
