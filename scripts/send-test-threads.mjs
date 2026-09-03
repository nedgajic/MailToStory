#!/usr/bin/env node
/**
 * Send test inbound threads to MailToStory via the Postmark webhook.
 *
 * Usage:
 *   node scripts/send-test-threads.mjs
 *   node scripts/send-test-threads.mjs --thread 3
 *   node scripts/send-test-threads.mjs --dry-run
 *   node scripts/send-test-threads.mjs --downloads ~/Downloads
 *
 * Required env (or in .env):
 *   POSTMARK_INBOUND_BASIC_USER
 *   POSTMARK_INBOUND_BASIC_PASSWORD
 *   TEST_FROM_EMAIL — must be a verified member/forwarding address for the workspace
 *
 * Optional:
 *   TEST_WEBHOOK_URL (default https://mailtostory.com/api/inbound/postmark)
 *   TEST_INBOUND_LOCAL (default ned)
 *   TEST_INBOUND_DOMAIN (default inbox.mailtostory.com)
 *   TEST_FROM_NAME
 *   TEST_DOWNLOADS_DIR (default ~/Downloads)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import {
  ALL_THREADS,
  buildForwardedBody,
} from "./test-threads/fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

loadEnv({ path: path.join(repoRoot, ".env") });
loadEnv({ path: path.join(repoRoot, ".env.local"), override: true });

function parseArgs(argv) {
  const args = { dryRun: false, thread: null, downloads: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--thread") args.thread = Number(argv[++i]);
    else if (a === "--downloads") args.downloads = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function expandHome(p) {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function mimeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
  };
  return map[ext] ?? "application/octet-stream";
}

function pickRandomImages(dir, count) {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|gif|webp|heic)$/i.test(f))
    .map((f) => path.join(dir, f));
  if (files.length === 0) return [];

  for (let i = files.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [files[i], files[j]] = [files[j], files[i]];
  }
  return files.slice(0, count);
}

function buildAttachments(imagePaths) {
  return imagePaths.map((filePath) => {
    const buf = fs.readFileSync(filePath);
    const name = path.basename(filePath);
    return {
      Name: name,
      Content: buf.toString("base64"),
      ContentType: mimeFor(name),
      ContentLength: buf.length,
      ContentID: null,
    };
  });
}

function basicAuthHeader(user, pass) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

async function sendThread({
  thread,
  index,
  webhookUrl,
  authUser,
  authPass,
  fromEmail,
  fromName,
  toAddress,
  downloadsDir,
  dryRun,
}) {
  const textBody = buildForwardedBody(thread.forwardNote, thread.messages);
  const attachmentCount =
    index === 0 ? 1 : index === 2 ? 1 : index === 3 ? 2 : index === 4 ? 2 : 0;
  const imagePaths = pickRandomImages(downloadsDir, attachmentCount);
  const attachments = buildAttachments(imagePaths);

  const payload = {
    From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    FromFull: { Email: fromEmail, Name: fromName || "" },
    To: toAddress,
    OriginalRecipient: toAddress,
    Subject: thread.subject,
    TextBody: textBody,
    Date: new Date().toUTCString(),
    MessageID: randomUUID(),
    Headers: [
      { Name: "Message-ID", Value: `<${randomUUID()}@test.mailtostory.local>` },
    ],
    Attachments: attachments,
  };

  const summary = {
    thread: index + 1,
    id: thread.id,
    turns: thread.messages.length,
    participants: new Set(
      thread.messages.map((m) => m.from.replace(/<.*>/, "").trim()),
    ).size,
    attachments: imagePaths.map((p) => path.basename(p)),
    subject: thread.subject,
    messageId: payload.MessageID,
  };

  if (dryRun) {
    console.log("[dry-run]", JSON.stringify(summary, null, 2));
    console.log("--- body preview ---\n", textBody.slice(0, 400), "...\n");
    return { ok: true, dryRun: true, summary };
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(authUser, authPass),
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Thread ${index + 1} failed (${res.status}): ${JSON.stringify(body)}`,
    );
  }

  console.log("✓ sent", summary, "→", body);
  return { ok: true, summary, body };
}

function printHelp() {
  console.log(`Send test threads to MailToStory inbound webhook.

Options:
  --thread N       Send only thread N (1-5)
  --downloads DIR  Folder for random image attachments (default ~/Downloads)
  --dry-run        Print payloads without sending

Env:
  TEST_FROM_EMAIL              Sender (must be allowlisted on workspace)
  POSTMARK_INBOUND_BASIC_USER
  POSTMARK_INBOUND_BASIC_PASSWORD
  TEST_WEBHOOK_URL             Default: https://mailtostory.com/api/inbound/postmark
  TEST_INBOUND_LOCAL           Default: ned
  TEST_INBOUND_DOMAIN          Default: inbox.mailtostory.com
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const authUser = process.env.POSTMARK_INBOUND_BASIC_USER?.trim();
  const authPass = process.env.POSTMARK_INBOUND_BASIC_PASSWORD?.trim();
  const fromEmail = process.env.TEST_FROM_EMAIL?.trim();
  const fromName = process.env.TEST_FROM_NAME?.trim() || "Ned Test";
  const webhookUrl =
    process.env.TEST_WEBHOOK_URL?.trim() ||
    "https://mailtostory.com/api/inbound/postmark";
  const localPart = process.env.TEST_INBOUND_LOCAL?.trim() || "ned";
  const domain =
    process.env.TEST_INBOUND_DOMAIN?.trim() || "inbox.mailtostory.com";
  const toAddress = `${localPart}@${domain}`;
  const downloadsDir = expandHome(
    args.downloads ||
      process.env.TEST_DOWNLOADS_DIR?.trim() ||
      "~/Downloads",
  );

  if (!args.dryRun && (!authUser || !authPass)) {
    console.error(
      "Missing POSTMARK_INBOUND_BASIC_USER / POSTMARK_INBOUND_BASIC_PASSWORD",
    );
    process.exit(1);
  }
  if (!fromEmail) {
    console.error(
      "Missing TEST_FROM_EMAIL — set to your verified account email for the ned workspace",
    );
    process.exit(1);
  }

  let threads = ALL_THREADS;
  if (args.thread) {
    const idx = args.thread - 1;
    if (idx < 0 || idx >= ALL_THREADS.length) {
      console.error("--thread must be 1-5");
      process.exit(1);
    }
    threads = [ALL_THREADS[idx]];
  }

  console.log(
    `Sending ${threads.length} thread(s) to ${toAddress} as ${fromEmail}`,
  );
  console.log(`Webhook: ${webhookUrl}`);
  if (!args.dryRun) {
    console.log(`Attachments from: ${downloadsDir}`);
  }

  for (let i = 0; i < threads.length; i++) {
    const globalIndex = args.thread ? args.thread - 1 : i;
    await sendThread({
      thread: threads[i],
      index: globalIndex,
      webhookUrl,
      authUser,
      authPass,
      fromEmail,
      fromName,
      toAddress,
      downloadsDir,
      dryRun: args.dryRun,
    });
    if (!args.dryRun && i < threads.length - 1) {
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  console.log("\nDone. Check your MailToStory dashboard for new stories.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
