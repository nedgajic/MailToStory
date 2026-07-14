import { GoogleGenerativeAI } from "@google/generative-ai";
import { tryParseModelJsonObject } from "@/lib/extract-json";
import { digestSchema, type Digest } from "@/lib/digest-schema";
import {
  isInvalidApiKeyErrorMessage,
  isInvalidApiKeyHttpError,
  isRetryableGeminiErrorMessage,
  isRetryableModelHttpError,
  parseApiKeyTryOrder,
  parseMaxOutputTokens,
  parseModelTryOrder,
} from "@/lib/geminiConfig";

const SYSTEM_INSTRUCTION = `You are a digest engine that transforms email threads into calm, readable narratives.
Return ONLY valid JSON matching the user's requested shape. No markdown, no code fences, no preamble.

LANGUAGE: Every human-readable string value in the JSON must be written in the same language as the majority of the email thread content the user provides (title, summaries, narrative, timeline lines, actions, roles). If languages are mixed, use the dominant one. JSON keys stay as specified.`;

function requireApiKeys(): string[] {
  const keys = parseApiKeyTryOrder();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return keys;
}

function formatAttemptLabel(keyIndex: number, model: string): string {
  return `key ${keyIndex + 1}, model ${model}`;
}

/** Non-streaming (REST). Tries each API key, then each model per key. */
export async function generateDigestFromPrompt(prompt: string): Promise<Digest> {
  const keys = requireApiKeys();
  const models = parseModelTryOrder();
  const maxOutputTokens = parseMaxOutputTokens();
  let lastErr = "";

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const apiKey = keys[keyIndex];

    for (const model of models) {
      const label = formatAttemptLabel(keyIndex, model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        if (keyIndex > 0 || model !== models[0]) {
          console.info(`[gemini] digest generated via ${label}`);
        }
        return await parseSuccessResponse(res);
      }

      const errText = await res.text();
      lastErr = `Gemini error ${res.status} (${label}): ${errText}`;
      console.error("[gemini]", lastErr);

      if (isInvalidApiKeyHttpError(res.status, errText)) {
        break;
      }

      if (!isRetryableModelHttpError(res.status, errText)) {
        throw new Error(lastErr);
      }
    }
  }

  throw new Error(
    lastErr ||
      "All Gemini API keys and models failed. Add GEMINI_API_KEY_FALLBACKS, set GEMINI_MODEL_FALLBACKS, or enable billing.",
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
  const keys = requireApiKeys();
  const models = parseModelTryOrder();
  const maxOutputTokens = parseMaxOutputTokens();
  let lastErr = "";

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const apiKey = keys[keyIndex];

    for (const modelName of models) {
      const label = formatAttemptLabel(keyIndex, modelName);

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
            maxOutputTokens,
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
          throw new Error(`Empty response from Gemini stream (${label}).`);
        }

        const parsed = tryParseModelJsonObject(accumulated);
        if (parsed === null) {
          return generateDigestFromPrompt(prompt);
        }

        const checked = digestSchema.safeParse(parsed);
        if (checked.success) {
          if (keyIndex > 0 || modelName !== models[0]) {
            console.info(`[gemini] stream digest generated via ${label}`);
          }
          return checked.data;
        }

        return generateDigestFromPrompt(prompt);
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (/Failed to parse stream|parse stream/i.test(lastErr)) {
          return generateDigestFromPrompt(prompt);
        }

        if (isInvalidApiKeyErrorMessage(lastErr)) {
          console.error("[gemini]", lastErr);
          break;
        }

        if (!isRetryableGeminiErrorMessage(lastErr)) {
          console.error("[gemini]", lastErr);
          throw new Error(lastErr);
        }

        console.error("[gemini]", lastErr);
      }
    }
  }

  throw new Error(
    lastErr ||
      "All Gemini API keys and models failed. Add GEMINI_API_KEY_FALLBACKS, set GEMINI_MODEL_FALLBACKS, or enable billing.",
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
        "The story was cut off (max output tokens). Try a shorter thread or set GEMINI_MAX_OUTPUT_TOKENS higher.",
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
