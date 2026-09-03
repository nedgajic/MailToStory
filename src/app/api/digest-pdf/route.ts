import { authOptions } from "@/auth";
import { DigestPdfDocument } from "@/components/digest/DigestPdfDocument";
import { digestPdfBaseFilename } from "@/lib/digestPdfFilename";
import { digestSchema } from "@/lib/digest-schema";
import { parseStoryColorModeInput, parseStoryDisplayThemeInput } from "@/lib/story-display-theme-schema";
import { registerPdfFonts } from "@/lib/registerPdfFonts";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { z } from "zod";

type PdfDocumentRoot = Parameters<typeof renderToBuffer>[0];

const bodySchema = z.object({
  digest: digestSchema,
  displayTheme: z.enum(["dossier", "moonletter", "wayfarer"]).optional(),
  colorMode: z.enum(["light", "dark"]).optional(),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid digest payload" }, { status: 400 });
  }

  const displayTheme = parseStoryDisplayThemeInput(parsed.data.displayTheme);
  const colorMode = parseStoryColorModeInput(parsed.data.colorMode);

  try {
    registerPdfFonts();
    const buffer = await renderToBuffer(
      createElement(DigestPdfDocument, {
        digest: parsed.data.digest,
        displayTheme,
        colorMode,
      }) as PdfDocumentRoot,
    );
    const base = digestPdfBaseFilename(parsed.data.digest.title);
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
