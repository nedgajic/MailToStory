/**
 * Ingest test threads directly into the app DB (no Postmark / webhook).
 *
 * Usage:
 *   npx tsx scripts/ingest-test-threads.ts
 *   npx tsx scripts/ingest-test-threads.ts --thread 3
 *   npx tsx scripts/ingest-test-threads.ts --dry-run
 *
 * Requires DATABASE_URL and GEMINI_API_KEY in .env (story generation).
 * Optional: TEST_FROM_EMAIL (default nedgajic@gmail.com), TEST_INBOUND_LOCAL (default ned)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { ingestAllowedPostmarkPayload } from "@/lib/inbound/ingest";
import prisma from "@/lib/prisma";
import { expandHome } from "./test-threads/payload-utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

loadEnv({ path: path.join(repoRoot, ".env") });
loadEnv({ path: path.join(repoRoot, ".env.local"), override: true });

type ThreadFixture = (typeof import("./test-threads/fixtures.mjs"))["ALL_THREADS"][number];

function parseArgs(argv: string[]) {
  const args: {
    dryRun: boolean;
    thread: number | null;
    downloads: string | null;
    help?: boolean;
  } = { dryRun: false, thread: null, downloads: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--thread") args.thread = Number(argv[++i]);
    else if (a === "--downloads") args.downloads = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Ingest test threads directly (no Postmark).

Options:
  --thread N       Ingest only thread N (1-5)
  --downloads DIR  Random image attachments from this folder (default ~/Downloads)
  --dry-run        Build payloads only, no DB writes
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const { ALL_THREADS } = await import("./test-threads/fixtures.mjs");
  const { buildPostmarkPayload } = await import("./test-threads/payload-utils.mjs");

  const fromEmail = process.env.TEST_FROM_EMAIL?.trim() || "nedgajic@gmail.com";
  const fromName = process.env.TEST_FROM_NAME?.trim() || "Ned Gajic";
  const localPart = process.env.TEST_INBOUND_LOCAL?.trim() || "ned";
  const domain =
    process.env.TEST_INBOUND_DOMAIN?.trim() || "inbox.mailtostory.com";
  const toAddress = `${localPart}@${domain}`;
  const downloadsDir = expandHome(
    args.downloads ||
      process.env.TEST_DOWNLOADS_DIR?.trim() ||
      "~/Downloads",
  );

  const workspace = await prisma.workspace.findFirst({
    where: { inboundLocalPart: localPart },
    select: { id: true, plan: true, seatQuantity: true, name: true },
  });

  if (!workspace) {
    const available = await prisma.workspace.findMany({
      select: { name: true, inboundLocalPart: true },
      take: 10,
    });
    console.error(
      `No workspace with inbound address "${localPart}@${domain}".`,
    );
    if (available.length > 0) {
      console.error("Available workspaces:");
      for (const w of available) {
        console.error(`  - ${w.inboundLocalPart}@${domain} (${w.name})`);
      }
    }
    process.exit(1);
  }

  let threads: ThreadFixture[] = ALL_THREADS;
  if (args.thread) {
    const idx = args.thread - 1;
    if (idx < 0 || idx >= ALL_THREADS.length) {
      console.error("--thread must be 1-5");
      process.exit(1);
    }
    threads = [ALL_THREADS[idx]!];
  }

  console.log(
    `Ingesting ${threads.length} thread(s) into workspace "${workspace.name}" (${toAddress})`,
  );
  console.log(`Simulated sender: ${fromName} <${fromEmail}>`);
  if (!args.dryRun && !process.env.GEMINI_API_KEY?.trim()) {
    console.warn(
      "Warning: GEMINI_API_KEY is not set — story generation will fail.",
    );
  }

  for (let i = 0; i < threads.length; i++) {
    const globalIndex = args.thread ? args.thread - 1 : i;
    const thread = threads[i]!;
    const { payload, meta } = buildPostmarkPayload({
      thread,
      index: globalIndex,
      fromEmail,
      fromName,
      toAddress,
      downloadsDir,
    });

    if (args.dryRun) {
      console.log("[dry-run]", { ...meta, messageId: payload.MessageID });
      continue;
    }

    const conversationId = await ingestAllowedPostmarkPayload({
      payload,
      workspace,
      fromEmail,
    });

    const story = await prisma.story.findUnique({
      where: { conversationId },
      select: { id: true, title: true, status: true },
    });

    console.log("✓ ingested", {
      ...meta,
      conversationId,
      storyId: story?.id ?? null,
      storyTitle: story?.title ?? "(generation pending or skipped)",
    });

    if (i < threads.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log("\nDone. Open /stories in the app to review.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
