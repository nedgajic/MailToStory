import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { buildForwardedBody } from "./fixtures.mjs";

export function expandHome(p) {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

export function mimeFor(filename) {
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

export function pickRandomImages(dir, count) {
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

export function buildAttachments(imagePaths) {
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

export function attachmentCountForThreadIndex(index) {
  if (index === 0) return 1;
  if (index === 2) return 1;
  if (index === 3) return 2;
  if (index === 4) return 2;
  return 0;
}

/**
 * @param {object} input
 * @param {import("./fixtures.mjs").ALL_THREADS[0]} input.thread
 * @param {number} input.index
 * @param {string} input.fromEmail
 * @param {string} [input.fromName]
 * @param {string} input.toAddress
 * @param {string} input.downloadsDir
 */
export function buildPostmarkPayload(input) {
  const { thread, index, fromEmail, fromName, toAddress, downloadsDir } = input;
  const textBody = buildForwardedBody(thread.forwardNote, thread.messages);
  const imagePaths = pickRandomImages(
    downloadsDir,
    attachmentCountForThreadIndex(index),
  );
  const attachments = buildAttachments(imagePaths);

  return {
    payload: {
      From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      FromFull: { Email: fromEmail, Name: fromName || "" },
      To: toAddress,
      OriginalRecipient: toAddress,
      Subject: thread.subject,
      TextBody: textBody,
      Date: new Date().toUTCString(),
      MessageID: randomUUID(),
      Headers: [
        {
          Name: "Message-ID",
          Value: `<${randomUUID()}@test.mailtostory.local>`,
        },
      ],
      Attachments: attachments,
    },
    meta: {
      id: thread.id,
      turns: thread.messages.length,
      participants: new Set(
        thread.messages.map((m) => m.from.replace(/<.*>/, "").trim()),
      ).size,
      attachments: imagePaths.map((p) => path.basename(p)),
      subject: thread.subject,
    },
  };
}
