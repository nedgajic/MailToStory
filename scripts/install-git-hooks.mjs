#!/usr/bin/env node
/**
 * Point git at repo-managed hooks (.githooks/) so pulls auto-run migrations.
 * Skips if the developer already set a custom core.hooksPath.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const gitDir = path.join(root, ".git");

if (!fs.existsSync(gitDir)) {
  process.exit(0);
}

const hooksDir = path.join(root, ".githooks");
if (!fs.existsSync(hooksDir)) {
  process.exit(0);
}

const current = spawnSync("git", ["config", "--get", "core.hooksPath"], {
  encoding: "utf8",
});

const hooksPath = current.stdout?.trim();
if (hooksPath && hooksPath !== ".githooks") {
  console.log(
    `[mailtostory] Keeping your git hooksPath (${hooksPath}); not installing .githooks.`,
  );
  process.exit(0);
}

spawnSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
