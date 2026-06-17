import { GoogleGenerativeAI } from "@google/generative-ai";
import { tryParseModelJsonObject } from "@/lib/extract-json";
import { digestSchema, type Digest } from "@/lib/digest-schema";

/** Free-tier quotas are per model; Google sometimes reports limit: 0 for a model with no free allocation. */
const DEFAULT_MODEL_TRY_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
] as const;

const SYSTEM_INSTRUCTION = `You are a digest engine that transforms email threads into calm, readable narratives.
Return ONLY valid JSON matching the user's requested shape. No markdown, no code fences, no preamble.

LANGUAGE: Every human-readable string value in the JSON must be written in the same language as the majority of the email thread content the user provides (title, summaries, narrative, timeline lines, actions, roles). If languages are mixed, use the dominant one. JSON keys stay as specified.`;

function modelTryOrder(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim();
  const fromEnv =
    process.env.GEMINI_MODEL_FALLBACKS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
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

const rawMax = process.env.GEMINI_MAX_OUTPUT_TOKENS?.trim();
const parsedMax = rawMax ? Number(rawMax) : NaN;
const MAX_OUTPUT_TOKENS = Math.min(
  65536,
  Math.max(2048, Number.isFinite(parsedMax) ? parsedMax : 16384),
);

/** Non-streaming (REST). */
export async function generateDigestFromPrompt(prompt: string): Promise<Digest> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const models = modelTryOrder();
  let lastErr = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
        },
      }),
    });

    if (res.ok) {
      return await parseSuccessResponse(res);
    }

    const errText = await res.text();
    lastErr = `Gemini error ${res.status} (model ${model}): ${errText}`;

    const retryable =
      res.status === 429 ||
      res.status === 404 ||
      (res.status === 400 && /not found|invalid/i.test(errText));

    if (!retryable) {
      throw new Error(lastErr);
    }
  }

  throw new Error(
    lastErr ||
      "All Gemini model attempts failed. Set GEMINI_MODEL to a model listed in https://ai.google.dev/gemini-api/docs/models or enable billing.",
  );
}

/**
 * Streaming generation — `onDelta` receives growing raw text (JSON-shaped prose).
 * Do not set `responseMimeType: application/json` here: the JS SDK often throws
 * "Failed to parse stream" for JSON streaming mode.
 */
export async function streamGenerateDigestFromPrompt(
  prompt: string,
  onDelta: (accumulated: string) => void,
): Promise<Digest> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const models = modelTryOrder();
  let lastErr = "";

  for (const modelName of models) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      let accumulated = "";
      try {
        for await (const chunk of result.stream) {
          let t = "";
          try {
            t = chunk.text();
          } catch {
            continue;
          }
          if (t) {
            accumulated += t;
            onDelta(accumulated);
          }
        }
      } catch (streamErr) {
        const msg =
          streamErr instanceof Error ? streamErr.message : String(streamErr);
        if (/Failed to parse stream|parse stream/i.test(msg)) {
          return generateDigestFromPrompt(prompt);
        }
        throw streamErr;
      }

      if (!accumulated.trim()) {
        throw new Error("Empty response from Gemini stream.");
      }

      const parsed = tryParseModelJsonObject(accumulated);
      if (parsed === null) {
        return generateDigestFromPrompt(prompt);
      }

      const checked = digestSchema.safeParse(parsed);
      if (checked.success) {
        return checked.data;
      }

      return generateDigestFromPrompt(prompt);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (/Failed to parse stream|parse stream/i.test(lastErr)) {
        return generateDigestFromPrompt(prompt);
      }
      if (!isRetryableGeminiError(e)) {
        throw new Error(lastErr);
      }
    }
  }

  throw new Error(
    lastErr ||
      "All Gemini stream attempts failed. Set GEMINI_MODEL or enable billing.",
  );
}

function isRetryableGeminiError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (/Failed to parse stream|parse stream/i.test(msg)) {
    return false;
  }
  return (
    /429|404|not found|RESOURCE_EXHAUSTED|503|quota|limit:\s*0/i.test(msg)
  );
}

async function parseSuccessResponse(res: Response): Promise<Digest> {
  const data: unknown = await res.json();
  const text = extractGeminiText(data);
  if (!text?.trim()) {
    throw new Error("Unexpected Gemini response shape.");
  }

  const finishReason = getGeminiFinishReason(data);
  const parsed = tryParseModelJsonObject(text);
  if (parsed === null) {
    if (finishReason === "MAX_TOKENS") {
      throw new Error(
        "The digest was cut off (max output tokens). Try a shorter thread or set GEMINI_MAX_OUTPUT_TOKENS higher.",
      );
    }
    throw new Error(
      "Model returned non-JSON text. The reply may include prose or truncated JSON.",
    );
  }

  return digestSchema.parse(parsed);
}

function getGeminiFinishReason(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const c = (data as { candidates?: Array<{ finishReason?: string }> })
    .candidates?.[0];
  return typeof c?.finishReason === "string" ? c.finishReason : undefined;
}

function extractGeminiText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const parts = root.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const joined = parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("");
  return joined.trim() ? joined : null;
}
