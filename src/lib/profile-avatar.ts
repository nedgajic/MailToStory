import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadRoot } from "@/lib/inbound/attachment-storage";
import {
  PROFILE_AVATAR_MAX_BYTES,
} from "@/lib/profile-avatar-shared";

const AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function avatarDir(): string {
  return path.join(uploadRoot(), "avatars");
}

function avatarPath(userId: string, ext: string): string {
  return path.join(avatarDir(), `${userId}${ext}`);
}

export function detectImageMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".jpg";
}

export async function saveProfileAvatar(
  userId: string,
  buffer: Buffer,
): Promise<{ mime: string }> {
  if (buffer.length > PROFILE_AVATAR_MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const mime = detectImageMime(buffer);
  if (!mime) {
    throw new Error("INVALID_IMAGE");
  }

  const ext = extensionForMime(mime);
  await mkdir(avatarDir(), { recursive: true });
  for (const other of AVATAR_EXTENSIONS) {
    if (other !== ext) {
      await unlink(avatarPath(userId, other)).catch(() => undefined);
    }
  }
  await writeFile(avatarPath(userId, ext), buffer);
  return { mime };
}

export async function readProfileAvatar(
  userId: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  for (const ext of AVATAR_EXTENSIONS) {
    try {
      const buffer = await readFile(avatarPath(userId, ext));
      const mime = MIME_BY_EXT[ext];
      if (!mime) continue;
      return { buffer, mime };
    } catch {
      continue;
    }
  }
  return null;
}

export async function deleteProfileAvatar(userId: string): Promise<void> {
  for (const ext of AVATAR_EXTENSIONS) {
    await unlink(avatarPath(userId, ext)).catch(() => undefined);
  }
}
