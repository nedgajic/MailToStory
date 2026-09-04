-- Track JWT session activity for admin reporting (NextAuth uses cookie/JWT, not Session rows).
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
