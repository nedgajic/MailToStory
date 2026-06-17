import type { Digest, NarrativeBlock } from "@/lib/digest-schema";

export type ProseBundleItem = {
  kind: "prose_bundle";
  block: Extract<NarrativeBlock, { type: "prose" }>;
  attachments: Extract<NarrativeBlock, { type: "attachment_reference" }>[];
  sourceIndex: number;
};

export type AttachmentOnlyItem = {
  kind: "attachment_only";
  block: Extract<NarrativeBlock, { type: "attachment_reference" }>;
  sourceIndex: number;
};

export type StoryRenderItem = ProseBundleItem | AttachmentOnlyItem;

/** Group consecutive attachment_reference blocks that share the preceding prose message_index. */
export function flattenNarrativeForStory(
  narrative: Digest["narrative"],
): StoryRenderItem[] {
  const out: StoryRenderItem[] = [];
  let i = 0;
  while (i < narrative.length) {
    const b = narrative[i];
    if (!b) break;
    if (b.type === "prose") {
      const attachments: Extract<
        NarrativeBlock,
        { type: "attachment_reference" }
      >[] = [];
      if (b.message_index != null) {
        let j = i + 1;
        while (j < narrative.length) {
          const n = narrative[j];
          if (!n || n.type !== "attachment_reference") break;
          if (n.message_index !== b.message_index) break;
          attachments.push(n);
          j++;
        }
        out.push({
          kind: "prose_bundle",
          block: b,
          attachments,
          sourceIndex: i,
        });
        i = j;
      } else {
        out.push({
          kind: "prose_bundle",
          block: b,
          attachments: [],
          sourceIndex: i,
        });
        i += 1;
      }
    } else {
      out.push({
        kind: "attachment_only",
        block: b,
        sourceIndex: i,
      });
      i += 1;
    }
  }
  return out;
}
