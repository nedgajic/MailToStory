import { authOptions } from "@/auth";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";
import { digestSchema } from "@/lib/digest-schema";
import { digestToDocxBuffer } from "@/lib/digestToDocx";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw =
    typeof body === "object" &&
    body !== null &&
    "digest" in body &&
    (body as { digest: unknown }).digest;

  const parsed = digestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid digest payload" }, { status: 400 });
  }

  try {
    const buffer = await digestToDocxBuffer(parsed.data);
    const base = digestPdfBaseFilename(parsed.data.title);
    const filename = `${base}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("digest-docx error:", e);
    return NextResponse.json(
      { error: "Failed to generate Word document" },
      { status: 500 },
    );
  }
}
