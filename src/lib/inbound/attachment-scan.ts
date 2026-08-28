import net from "node:net";

export type AttachmentScanResult =
  | { ok: true }
  | { ok: false; reason: "blocked" | "malware"; detail: string };

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".ps1",
  ".vbs",
  ".js",
  ".jse",
  ".wsf",
  ".dll",
  ".msi",
  ".msp",
  ".hta",
  ".cpl",
  ".jar",
  ".app",
  ".dmg",
  ".pkg",
  ".deb",
  ".rpm",
  ".sh",
  ".bash",
  ".bin",
]);

const BLOCKED_MIME_PREFIXES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-dosexec",
  "application/vnd.microsoft.portable-executable",
  "application/x-sh",
  "application/x-bsh",
  "application/java-archive",
];

const BLOCKED_MIME_EXACT = new Set([
  "application/x-msi",
  "application/x-ms-shortcut",
  "text/x-shellscript",
  "application/x-httpd-php",
]);

function extensionOf(filename: string): string {
  const lower = filename.trim().toLowerCase();
  const idx = lower.lastIndexOf(".");
  if (idx <= 0) return "";
  return lower.slice(idx);
}

export function isBlockedAttachmentType(filename: string, mimeType: string): string | null {
  const ext = extensionOf(filename);
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return `blocked file type (${ext})`;
  }
  const mime = mimeType.trim().toLowerCase();
  if (BLOCKED_MIME_EXACT.has(mime)) {
    return `blocked MIME type (${mime})`;
  }
  if (BLOCKED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) {
    return `blocked MIME type (${mime})`;
  }
  return null;
}

function clamavConfig(): { host: string; port: number } | null {
  const host = process.env.CLAMAV_HOST?.trim();
  if (!host) return null;
  const port = Number.parseInt(process.env.CLAMAV_PORT?.trim() || "3310", 10);
  if (!Number.isFinite(port) || port <= 0) return null;
  return { host, port };
}

function scanWithClamd(buffer: Buffer): Promise<string | null> {
  const config = clamavConfig();
  if (!config) return Promise.resolve(null);

  return new Promise((resolve) => {
    const socket = net.createConnection(config.port, config.host);
    let response = "";
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, 8000);

    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      const chunkSize = Buffer.alloc(4);
      chunkSize.writeUInt32BE(buffer.length, 0);
      socket.write(chunkSize);
      socket.write(buffer);
      const end = Buffer.alloc(4);
      end.writeUInt32BE(0, 0);
      socket.write(end);
    });

    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
    });

    socket.on("error", () => {
      clearTimeout(timeout);
      resolve(null);
    });

    socket.on("close", () => {
      clearTimeout(timeout);
      const trimmed = response.trim();
      if (!trimmed) {
        resolve(null);
        return;
      }
      if (/OK$/i.test(trimmed)) {
        resolve(null);
        return;
      }
      const match = trimmed.match(/FOUND$/i) ? trimmed : trimmed;
      resolve(match);
    });
  });
}

export async function scanAttachmentBuffer(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<AttachmentScanResult> {
  const blocked = isBlockedAttachmentType(input.filename, input.mimeType);
  if (blocked) {
    return { ok: false, reason: "blocked", detail: blocked };
  }

  const clamResult = await scanWithClamd(input.buffer);
  if (clamResult) {
    return { ok: false, reason: "malware", detail: clamResult };
  }

  return { ok: true };
}
