import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export type AttachmentStorageBackend = "local" | "r2";

export type StoredAttachment = {
  storagePath: string;
  storageBackend: AttachmentStorageBackend;
};

function r2Env() {
  return {
    bucket: process.env.R2_BUCKET?.trim() || "",
    endpoint: process.env.R2_ENDPOINT?.trim() || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || "",
    prefix: (process.env.R2_PREFIX?.trim() || "attachments").replace(/^\/+|\/+$/g, ""),
  };
}

export function isR2Configured(): boolean {
  const env = r2Env();
  return Boolean(env.bucket && env.endpoint && env.accessKeyId && env.secretAccessKey);
}

export function attachmentStorageMode(): AttachmentStorageBackend {
  const configured = process.env.ATTACHMENT_STORAGE?.trim().toLowerCase();
  if (configured === "local") return "local";
  if (configured === "r2") {
    if (!isR2Configured()) {
      console.warn("[storage] ATTACHMENT_STORAGE=r2 but R2 env vars are incomplete; using local disk.");
      return "local";
    }
    return "r2";
  }
  return isR2Configured() ? "r2" : "local";
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  const env = r2Env();
  s3Client = new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
    forcePathStyle: true,
  });
  return s3Client;
}

export function uploadRoot(): string {
  const configured = process.env.INBOUND_UPLOAD_DIR?.trim();
  if (configured) return configured;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
}

function objectKey(input: {
  workspaceId: string;
  conversationId: string;
  attachmentId: string;
  filename: string;
}): string {
  const env = r2Env();
  const safeName = input.filename.replace(/[/\\]/g, "_");
  return `${env.prefix}/${input.workspaceId}/${input.conversationId}/${input.attachmentId}-${safeName}`;
}

async function streamToBuffer(body: Readable | ReadableStream | Blob | undefined): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (typeof (body as Blob).arrayBuffer === "function") {
    return Buffer.from(await (body as Blob).arrayBuffer());
  }
  const reader = (body as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function writeAttachment(input: {
  workspaceId: string;
  conversationId: string;
  attachmentId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<StoredAttachment> {
  const backend = attachmentStorageMode();
  if (backend === "r2") {
    const key = objectKey(input);
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: r2Env().bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType || "application/octet-stream",
      }),
    );
    return { storagePath: key, storageBackend: "r2" };
  }

  const dir = path.join(
    /*turbopackIgnore: true*/ uploadRoot(),
    input.workspaceId,
    input.conversationId,
  );
  await mkdir(dir, { recursive: true });
  const storagePath = path.join(
    /*turbopackIgnore: true*/ dir,
    `${input.attachmentId}-${input.filename.replace(/[/\\]/g, "_")}`,
  );
  await writeFile(storagePath, input.buffer);
  return { storagePath, storageBackend: "local" };
}

export async function readAttachmentBuffer(input: {
  storagePath: string;
  storageBackend: string;
}): Promise<Buffer> {
  if (input.storageBackend === "r2") {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: r2Env().bucket,
        Key: input.storagePath,
      }),
    );
    return streamToBuffer(response.Body as Readable | undefined);
  }
  return readFile(/*turbopackIgnore: true*/ input.storagePath);
}

export async function deleteAttachmentFile(input: {
  storagePath: string;
  storageBackend: string;
}): Promise<void> {
  if (!input.storagePath) return;
  try {
    if (input.storageBackend === "r2") {
      await getS3Client().send(
        new DeleteObjectCommand({
          Bucket: r2Env().bucket,
          Key: input.storagePath,
        }),
      );
      return;
    }
    await unlink(/*turbopackIgnore: true*/ input.storagePath);
  } catch {
    /* already gone */
  }
}
