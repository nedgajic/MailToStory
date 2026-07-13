import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

/** Embedded fonts for PDF export (Latin Extended, including Slovenian č š ž). */
export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: "Lora",
    fonts: [
      {
        src: path.join(fontsDir, "Lora-Regular.ttf"),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: path.join(fontsDir, "Lora-Regular.ttf"),
        fontWeight: "bold",
        fontStyle: "normal",
      },
      {
        src: path.join(fontsDir, "Lora-Italic.ttf"),
        fontWeight: "normal",
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "DM Mono",
    fonts: [
      {
        src: path.join(fontsDir, "DMMono-Regular.ttf"),
        fontWeight: "normal",
        fontStyle: "normal",
      },
      {
        src: path.join(fontsDir, "DMMono-Medium.ttf"),
        fontWeight: "bold",
        fontStyle: "normal",
      },
    ],
  });
}
