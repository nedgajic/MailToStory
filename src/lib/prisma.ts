import { statSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaMtime?: number;
};

function prismaSchemaMtime(): number {
  try {
    return statSync(path.join(process.cwd(), "prisma/schema.prisma")).mtimeMs;
  } catch {
    return 0;
  }
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({ log: ["error", "warn"] });
}

const schemaMtime = prismaSchemaMtime();
const staleDevClient =
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaMtime !== schemaMtime;

if (staleDevClient) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = undefined;
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaSchemaMtime = schemaMtime;
}

export const prisma = globalForPrisma.prisma;

export default prisma;
