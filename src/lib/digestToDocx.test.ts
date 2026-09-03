import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { Digest } from "@/lib/digest-schema";
import { digestToDocxBuffer } from "./digestToDocx";

const sample: Digest = {
  title: "Slovenščina sync",
  resolution_summary: "Dogovor o č š ž.",
  status: "resolved",
  narrative: [
    {
      type: "prose",
      content: "Pozdrav ekipa.",
      speaker: "Ana",
      message_index: 1,
    },
    {
      type: "attachment_reference",
      filename: "porocilo.pdf",
      context: "Mesečno poročilo",
      speaker: "Ana",
      message_index: 1,
    },
  ],
  timeline: [
    {
      date: "2024-03-01",
      actor: "Ana",
      summary: "Poslala osnutek.",
      message_index: 1,
    },
  ],
  action_items: [{ owner: "Boštjan", action: "Pregled", due: "2024-03-05" }],
  participants: [
    { name: "Ana Novak", email: "ana@example.com", role: "Lead" },
  ],
};

describe("digestToDocx", () => {
  it("generates a docx buffer without attachment references", async () => {
    const buffer = await digestToDocxBuffer(sample);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    expect(documentXml).toBeDefined();
    const xml = documentXml ?? "";

    expect(xml).toContain("Sloven");
    expect(xml).not.toContain("porocilo.pdf");
    expect(xml).not.toContain("Mesečno poročilo");
    expect(xml).not.toContain("Thread story");
    expect(xml).toContain("Recap");
    expect(xml).toContain("Story");
    expect(xml).toContain("Timeline");
    expect(xml).toContain("Action items");
    expect(xml).toContain("Participants");
  });
});
