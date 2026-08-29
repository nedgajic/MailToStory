#!/usr/bin/env node
/**
 * Apply pending Prisma migrations when DATABASE_URL is configured.
 * Used by `npm run dev` and git hooks after pulls that touch prisma/.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  const { config } = await import("dotenv");
  config({ path: envPath });
}

function runPrisma(args) {
  return spawnSync("npx", ["prisma", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function log(message) {
  console.log(`[mailtostory] ${message}`);
}

function warn(message) {
  console.warn(`[mailtostory] ${message}`);
}

if (!process.env.DATABASE_URL?.trim()) {
  warn("No DATABASE_URL — skipping Prisma migrations.");
  process.exit(0);
}

log("Checking for pending Prisma migrations…");

const status = runPrisma(["migrate", "status"]);
const output = `${status.stdout ?? ""}${status.stderr ?? ""}`.trim();

if (/Can't reach database server|P1001|P1010|ECONNREFUSED/i.test(output)) {
  warn("Database unreachable — start Postgres (`docker compose up -d`) then retry.");
  warn("Skipping migrations for now.");
  process.exit(0);
}

const hasPending =
  /Following migration have not yet been applied|not yet been applied/i.test(
    output,
  );

if (!hasPending && status.status === 0) {
  log("Database schema is up to date.");
  process.exit(0);
}

if (!hasPending && status.status !== 0) {
  warn("Could not read migration status:");
  if (output) console.warn(output);
  process.exit(status.status ?? 1);
}

log("Applying pending migrations…");

const deploy = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
});

if (deploy.status !== 0) {
  console.error(
    "[mailtostory] Migration failed. Check DATABASE_URL and that Postgres is running.",
  );
  process.exit(deploy.status ?? 1);
}

log("Migrations applied.");
