#!/usr/bin/env node
/**
 * Quick environment check before / after npm install.
 * Run: npm run doctor
 */

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

  const root = path.resolve(process.cwd());
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    console.warn(
      "[mailtostory] No .env file yet — copy .env.example to .env when ready.",
    );
  } else {
    console.log("[mailtostory] .env exists.");
  }

  const nm = path.join(root, "node_modules");
  if (!fs.existsSync(nm)) {
    console.warn(
      "[mailtostory] node_modules missing — run: npm install",
    );
  } else {
    console.log("[mailtostory] node_modules present.");
  }
} catch (e) {
  console.warn("[mailtostory] Could not check files:", e);
}

process.exit(failed ? 1 : 0);
