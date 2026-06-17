-- CreateTable
CREATE TABLE "ThreadDigest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "digest" JSONB NOT NULL,
    "messageIdsInOrder" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThreadDigest_userId_idx" ON "ThreadDigest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadDigest_userId_threadId_key" ON "ThreadDigest"("userId", "threadId");

-- AddForeignKey
ALTER TABLE "ThreadDigest" ADD CONSTRAINT "ThreadDigest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
