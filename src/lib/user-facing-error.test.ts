import { describe, expect, it } from "vitest";
import { formatUserFacingError } from "@/lib/user-facing-error";

describe("formatUserFacingError", () => {
  it("formats raw Gemini 503 JSON into friendly copy", () => {
    const raw =
      'Gemini error 503 (model gemini-2.5-flash): { "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.", "status": "UNAVAILABLE" } }';

    const result = formatUserFacingError(raw);

    expect(result.title).toBe("The AI is busy right now");
    expect(result.message).toContain("high demand");
    expect(result.message).not.toContain("gemini-2.5-flash");
    expect(result.message).not.toContain("UNAVAILABLE");
    expect(result.canRetry).toBe(true);
  });

  it("handles quota / 429 errors", () => {
    const result = formatUserFacingError(
      'Gemini error 429 (model gemini-2.5-flash): {"error":{"code":429,"message":"Quota exceeded","status":"RESOURCE_EXHAUSTED"}}',
    );

    expect(result.title).toMatch(/limit|requests/i);
    expect(result.canRetry).toBe(true);
  });

  it("handles session expiry", () => {
    const result = formatUserFacingError("Unauthorized — sign in again.");
    expect(result.title).toBe("Session expired");
    expect(result.canRetry).toBe(false);
  });

  it("handles missing API key without exposing env var name", () => {
    const result = formatUserFacingError("GEMINI_API_KEY is not set.");
    expect(result.message).not.toContain("GEMINI_API_KEY");
    expect(result.canRetry).toBe(false);
  });

  it("falls back gracefully for unknown technical errors", () => {
    const result = formatUserFacingError(
      "Error: ECONNRESET at TCP.onStreamRead",
    );
    expect(result.title).toBe("Couldn't generate your story");
    expect(result.message).not.toContain("ECONNRESET");
    expect(result.canRetry).toBe(true);
  });
});
