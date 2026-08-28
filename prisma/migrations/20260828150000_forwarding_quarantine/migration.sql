-- Verified forwarding addresses and quarantine for unknown senders.
CREATE TABLE "ForwardingAddress" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForwardingAddress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ForwardingAddress_workspaceId_email_key" ON "ForwardingAddress"("workspaceId", "email");
CREATE INDEX "ForwardingAddress_workspaceId_idx" ON "ForwardingAddress"("workspaceId");

CREATE TABLE "QuarantinedInbound" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "snippet" TEXT NOT NULL DEFAULT '',
    "payloadJson" JSONB NOT NULL,
    "postmarkMessageId" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuarantinedInbound_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuarantinedInbound_postmarkMessageId_key" ON "QuarantinedInbound"("postmarkMessageId");
CREATE INDEX "QuarantinedInbound_workspaceId_fromEmail_idx" ON "QuarantinedInbound"("workspaceId", "fromEmail");
CREATE INDEX "QuarantinedInbound_expiresAt_idx" ON "QuarantinedInbound"("expiresAt");

ALTER TABLE "ForwardingAddress" ADD CONSTRAINT "ForwardingAddress_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuarantinedInbound" ADD CONSTRAINT "QuarantinedInbound_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
