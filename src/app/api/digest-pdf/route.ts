import { authOptions } from "@/auth";
import { DigestPdfDocument } from "@/components/digest/DigestPdfDocument";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";
import { digestSchema } from "@/lib/digest-schema";
import { registerPdfFonts } from "@/lib/registerPdfFonts";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

type PdfDocumentRoot = Parameters<typeof renderToBuffer>[0];

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
    registerPdfFonts();
    const buffer = await renderToBuffer(
      createElement(DigestPdfDocument, {
        digest: parsed.data,
      }) as PdfDocumentRoot,
    );
    const base = digestPdfBaseFilename(parsed.data.title);
    const filename = `${base}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("digest-pdf error:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
