import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { DIGEST_EXPORT_MONO, DIGEST_EXPORT_SERIF } from "./digestExportContent";
import { registerPdfFonts } from "./registerPdfFonts";

describe("registerPdfFonts", () => {
  it("embeds Unicode fonts so Slovenian characters are not dropped", async () => {
    registerPdfFonts();

    const buffer = await renderToBuffer(
      createElement(
        Document,
        null,
        createElement(
          Page,
          null,
          createElement(
            Text,
            { style: { fontFamily: DIGEST_EXPORT_SERIF, fontSize: 12 } },
            "Slovenščina: čšž ČŠŽ",
          ),
          createElement(
            Text,
            { style: { fontFamily: DIGEST_EXPORT_MONO, fontSize: 10 } },
            "Meta · čšž",
          ),
        ),
      ),
    );

    const pdf = Buffer.from(buffer).toString("binary");
    expect(pdf).toContain("/FontFile2");
    expect(pdf).not.toContain("/Subtype /Type1");
  });
});
