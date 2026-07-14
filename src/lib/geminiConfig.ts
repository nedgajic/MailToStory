/**
 * Gemini model and API key resolution from environment.
 * Similar-tier Flash models only — keeps story output consistent across fallbacks.
 */

/** Default chain when GEMINI_MODEL / GEMINI_MODEL_FALLBACKS are unset. */
export const DEFAULT_MODEL_TRY_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

export type GeminiEnv = {
  GEMINI_API_KEY?: string;
  GEMINI_API_KEY_FALLBACKS?: string;
  GEMINI_MODEL?: string;
  GEMINI_MODEL_FALLBACKS?: string;
  GEMINI_MAX_OUTPUT_TOKENS?: string;
};

function splitCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Primary key first, then GEMINI_API_KEY_FALLBACKS (deduped). */
export function parseApiKeyTryOrder(
  env: GeminiEnv = process.env as GeminiEnv,
): string[] {
  const primary = env.GEMINI_API_KEY?.trim();
  const fallbacks = splitCsv(env.GEMINI_API_KEY_FALLBACKS);
  const seen = new Set<string>();
  const order: string[] = [];

  for (const key of [primary, ...fallbacks]) {
    if (key && !seen.has(key)) {
      seen.add(key);
      order.push(key);
    }
  }

  return order;
}

/** GEMINI_MODEL, then GEMINI_MODEL_FALLBACKS, then built-in Flash defaults (deduped). */
export function parseModelTryOrder(
  env: GeminiEnv = process.env as GeminiEnv,
): string[] {
  const primary = env.GEMINI_MODEL?.trim();
  const fromEnv = splitCsv(env.GEMINI_MODEL_FALLBACKS);
  const seen = new Set<string>();
  const order: string[] = [];

  for (const m of [
    ...(primary ? [primary] : []),
    ...fromEnv,
    ...DEFAULT_MODEL_TRY_ORDER,
  ]) {
    if (m && !seen.has(m)) {
      seen.add(m);
      order.push(m);
    }
  }

  return order;
}

export function parseMaxOutputTokens(
  env: GeminiEnv = process.env as GeminiEnv,
): number {
  const raw = env.GEMINI_MAX_OUTPUT_TOKENS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Math.min(
    65536,
    Math.max(2048, Number.isFinite(parsed) ? parsed : 16384),
  );
}

/** Model-level failures — try the next model on the same key. */
export function isRetryableModelHttpError(
  status: number,
  errText: string,
): boolean {
  return (
    status === 429 ||
    status === 503 ||
    status === 404 ||
    (status === 400 && /not found|invalid model/i.test(errText))
  );
}

/** Key-level failures — skip remaining models and try the next API key. */
export function isInvalidApiKeyHttpError(
  status: number,
  errText: string,
): boolean {
  return (
    status === 401 ||
    status === 403 ||
    /API_KEY_INVALID|API key not valid|permission denied/i.test(errText)
  );
}

export function isRetryableGeminiErrorMessage(message: string): boolean {
  if (/Failed to parse stream|parse stream/i.test(message)) {
    return false;
  }
  return (
    /429|404|not found|RESOURCE_EXHAUSTED|503|UNAVAILABLE|quota|limit:\s*0/i.test(
      message,
    )
  );
}

export function isInvalidApiKeyErrorMessage(message: string): boolean {
  return /API_KEY_INVALID|API key not valid|401|403|permission denied/i.test(
    message,
  );
}
