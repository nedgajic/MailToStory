import type { PlanId } from "@/lib/billing/plans";
import { creditCostLabel } from "@/lib/billing/credits-shared";

export const STORY_LENGTHS = ["concise", "normal", "elaborate"] as const;
export type StoryLength = (typeof STORY_LENGTHS)[number];

export const DEFAULT_STORY_LENGTH: StoryLength = "normal";

export type StoryLengthOption = {
  id: StoryLength;
  label: string;
  hint: string;
  creditLabel: string;
  proOnly?: boolean;
};

export const STORY_LENGTH_OPTIONS: StoryLengthOption[] = [
  {
    id: "concise",
    label: "Concise",
    hint: "Short recap and 1–2 sentences per turn",
    creditLabel: creditCostLabel("concise"),
  },
  {
    id: "normal",
    label: "Normal",
    hint: "Balanced magazine-style narrative",
    creditLabel: creditCostLabel("normal"),
  },
  {
    id: "elaborate",
    label: "Elaborate",
    hint: "Rich detail, up to 6–8 sentences per turn",
    creditLabel: creditCostLabel("elaborate"),
    proOnly: true,
  },
];

export function parseStoryLength(value: unknown): StoryLength {
  if (typeof value === "string" && (STORY_LENGTHS as readonly string[]).includes(value)) {
    return value as StoryLength;
  }
  return DEFAULT_STORY_LENGTH;
}

/** Elaborate length is paid-only (Pro and Team). */
export function storyLengthLabel(length: StoryLength): string {
  return STORY_LENGTH_OPTIONS.find((option) => option.id === length)?.label ?? length;
}

export function canUseElaborateStoryLength(plan: PlanId): boolean {
  return plan !== "free";
}
