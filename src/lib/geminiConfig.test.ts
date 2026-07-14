import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODEL_TRY_ORDER,
  parseApiKeyTryOrder,
  parseModelTryOrder,
  isInvalidApiKeyHttpError,
  isRetryableModelHttpError,
} from "@/lib/geminiConfig";

describe("parseApiKeyTryOrder", () => {
  it("returns primary key only when no fallbacks", () => {
    expect(
      parseApiKeyTryOrder({ GEMINI_API_KEY: "key-a" }),
    ).toEqual(["key-a"]);
  });

  it("appends fallback keys in order and dedupes", () => {
    expect(
      parseApiKeyTryOrder({
        GEMINI_API_KEY: "key-a",
        GEMINI_API_KEY_FALLBACKS: "key-b, key-c, key-a",
      }),
    ).toEqual(["key-a", "key-b", "key-c"]);
  });

  it("returns empty when unset", () => {
    expect(parseApiKeyTryOrder({})).toEqual([]);
  });
});

describe("parseModelTryOrder", () => {
  it("uses built-in Flash defaults when env unset", () => {
    expect(parseModelTryOrder({})).toEqual([...DEFAULT_MODEL_TRY_ORDER]);
  });

  it("puts GEMINI_MODEL first then fallbacks then defaults", () => {
    expect(
      parseModelTryOrder({
        GEMINI_MODEL: "gemini-custom",
        GEMINI_MODEL_FALLBACKS: "gemini-2.5-flash-lite",
      }),
    ).toEqual([
      "gemini-custom",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
    ]);
  });

  it("dedupes models", () => {
    expect(
      parseModelTryOrder({
        GEMINI_MODEL: "gemini-2.5-flash",
        GEMINI_MODEL_FALLBACKS: "gemini-2.5-flash, gemini-2.5-flash-lite",
      }),
    ).toEqual(["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"]);
  });
});

describe("retry classification", () => {
  it("treats quota and overload as model-retryable", () => {
    expect(isRetryableModelHttpError(429, "RESOURCE_EXHAUSTED")).toBe(true);
    expect(isRetryableModelHttpError(503, "UNAVAILABLE")).toBe(true);
    expect(isRetryableModelHttpError(404, "not found")).toBe(true);
  });

  it("treats invalid API key as key-level", () => {
    expect(isInvalidApiKeyHttpError(403, "API key not valid")).toBe(true);
    expect(isInvalidApiKeyHttpError(400, "bad prompt")).toBe(false);
  });
});
