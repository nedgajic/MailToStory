/** Client-safe credit helpers (no server imports). */

export type CreditStoryLength = "concise" | "normal" | "elaborate";

/** Internal units: 10 = 1.0 credit (avoids floats). */
export const CREDIT_UNIT = 10;

export const CREDIT_COST_BY_LENGTH: Record<CreditStoryLength, number> = {
  concise: 5,
  normal: 10,
  elaborate: 15,
};

export const MAX_STORY_VERSIONS = 20;

export function creditCostForLength(length: CreditStoryLength): number {
  return CREDIT_COST_BY_LENGTH[length] ?? CREDIT_UNIT;
}

export function formatCredits(units: number): string {
  const value = units / CREDIT_UNIT;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function creditCostLabel(length: CreditStoryLength): string {
  return `${formatCredits(creditCostForLength(length))} credit`;
}
