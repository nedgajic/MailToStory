import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDigestFromPrompt } from "@/lib/gemini";

const minimalDigest = {
  title: "Test thread",
  resolution_summary: "Done.",
  status: "ongoing",
  narrative: [{ type: "prose", content: "Hello." }],
  timeline: [{ date: "2024-01-01", actor: "A", summary: "S" }],
  action_items: [{ owner: null, action: "Do", due: null }],
  participants: [{ name: "N", email: "e@e.com", role: "R" }],
};

function geminiOkResponse() {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(minimalDigest) }],
        },
        finishReason: "STOP",
      },
    ],
  };
}

describe("generateDigestFromPrompt key fallbacks", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "primary-key");
    vi.stubEnv("GEMINI_API_KEY_FALLBACKS", "backup-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test-a");
    vi.stubEnv("GEMINI_MODEL_FALLBACKS", "gemini-test-b");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses backup API key when primary is exhausted on all models", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (url: string) => {
        if (url.includes("primary-key")) {
          return {
            ok: false,
            status: 429,
            text: async () => "RESOURCE_EXHAUSTED",
          };
        }
        if (url.includes("backup-key") && url.includes("gemini-test-a")) {
          return {
            ok: true,
            status: 200,
            json: async () => geminiOkResponse(),
          };
        }
        return {
          ok: false,
          status: 500,
          text: async () => "unexpected",
        };
      });

    vi.stubGlobal("fetch", fetchMock);

    const digest = await generateDigestFromPrompt("summarize this");

    expect(digest.title).toBe("Test thread");
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("primary-key"))).toBe(
      true,
    );
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("backup-key"))).toBe(
      true,
    );
  });

  it("does not try backup key on non-retryable errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "internal error",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateDigestFromPrompt("summarize this")).rejects.toThrow(
      /internal error/i,
    );

    expect(
      fetchMock.mock.calls.every((c) => String(c[0]).includes("primary-key")),
    ).toBe(true);
  });
});
