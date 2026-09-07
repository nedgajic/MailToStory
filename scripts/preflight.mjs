#!/usr/bin/env node
/**
 * Quick environment check before / after npm install.
 * Run: npm run doctor
 */

const DEV_PORT = 3001;

const major = Number(process.version.slice(1).split(".")[0] || 0);

let failed = false;

if (major < 20) {
  console.error(
    `[mailtostory] Node 20+ is required. You have ${process.version}.`,
  );
  console.error("  Install Node 20 LTS: https://nodejs.org/ or use nvm/fnm.");
  failed = true;
} else {
  console.log(`[mailtostory] Node OK: ${process.version}`);
}

try {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { spawnSync } = await import("node:child_process");

  const root = path.resolve(process.cwd());
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    console.warn(
      "[mailtostory] No .env file yet — copy .env.example to .env when ready.",
    );
  } else {
    console.log("[mailtostory] .env exists.");
    const { config } = await import("dotenv");
    config({ path: envPath });
  }

  const nm = path.join(root, "node_modules");
  if (!fs.existsSync(nm)) {
    console.warn(
      "[mailtostory] node_modules missing — run: npm install",
    );
  } else {
    console.log("[mailtostory] node_modules present.");
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl);
      const port = url.port || (url.protocol === "https:" ? "443" : "80");
      if (url.hostname === "localhost" && port !== String(DEV_PORT)) {
        console.warn(
          `[mailtostory] NEXTAUTH_URL uses port ${port}, but npm run dev listens on ${DEV_PORT}.`,
        );
        console.warn(
          `  Set NEXTAUTH_URL="http://localhost:${DEV_PORT}" in .env (and match Google OAuth redirect URIs).`,
        );
      }
    } catch {
      console.warn("[mailtostory] NEXTAUTH_URL is not a valid URL.");
    }
  }

  if (process.env.DATABASE_URL?.trim()) {
    const status = spawnSync("npx", ["prisma", "migrate", "status"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output = `${status.stdout ?? ""}${status.stderr ?? ""}`;
    if (/Can't reach database server|P1001|P1010|ECONNREFUSED/i.test(output)) {
      console.warn(
        "[mailtostory] Database unreachable — run: docker compose up -d",
      );
    } else if (
      /Following migration have not yet been applied|not yet been applied/i.test(
        output,
      )
    ) {
      console.warn(
        "[mailtostory] Pending Prisma migrations — run: npm run db:migrate (or npm run dev applies them automatically).",
      );
    } else if (status.status === 0) {
      console.log("[mailtostory] Database schema is up to date.");
    }
  }
} catch (e) {
  console.warn("[mailtostory] Could not check files:", e);
}

process.exit(failed ? 1 : 0);
