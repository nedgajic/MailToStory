import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import {
  deleteProfileAvatar,
  readProfileAvatar,
  saveProfileAvatar,
} from "@/lib/profile-avatar";
import { profileAvatarUrl } from "@/lib/profile-avatar-shared";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stored = await readProfileAvatar(session.user.id);
  if (!stored) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(stored.buffer), {
    headers: {
      "Content-Type": stored.mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await saveProfileAvatar(session.user.id, buffer);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FILE_TOO_LARGE") {
        return NextResponse.json(
          { error: "Photo must be 2 MB or smaller." },
          { status: 400 },
        );
      }
      if (error.message === "INVALID_IMAGE") {
        return NextResponse.json(
          { error: "Upload a JPG, PNG, or WebP image." },
          { status: 400 },
        );
      }
    }
    throw error;
  }

  const image = profileAvatarUrl();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image },
  });

  return NextResponse.json({ ok: true, image });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteProfileAvatar(session.user.id);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  return NextResponse.json({ ok: true, image: null });
}
