import { BRAND_NAME } from "@/lib/brand";

export type UserFacingError = {
  title: string;
  message: string;
  hint?: string;
  canRetry: boolean;
};

function normalizeRawError(raw: unknown): string {
  if (raw instanceof Error) return raw.message.trim();
  if (typeof raw === "string") return raw.trim();
  return String(raw ?? "").trim();
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readNestedMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message.trim()) {
    return obj.message.trim();
  }
  if (obj.error) {
    return readNestedMessage(obj.error);
  }
  return null;
}

function extractHttpStatus(text: string): number | undefined {
  const match = text.match(/\b([45]\d{2})\b/);
  if (!match) return undefined;
  const code = Number(match[1]);
  return Number.isFinite(code) ? code : undefined;
}

function looksTechnical(message: string): boolean {
  return (
    /^\s*\{/.test(message) ||
    /^Error:\s/i.test(message) ||
    /\b(ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up)\b/i.test(
      message,
    ) ||
    /\bat\s+\S+\(.+\)/.test(message) ||
    /Gemini error \d+/i.test(message) ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|INVALID_ARGUMENT/i.test(message) ||
    message.length > 280
  );
}

function titleForStatus(status: number | undefined): string {
  if (status === 503) return "The AI is busy right now";
  if (status === 429) return "Too many requests";
  if (status === 401 || status === 403) return "Can't reach the AI service";
  if (status === 404) return "AI model unavailable";
  if (status && status >= 500) return "Something went wrong";
  return "Couldn't generate your story";
}

function hintForStatus(status: number | undefined): string | undefined {
  if (status === 503 || status === 429) {
    return "This is usually temporary. Wait a few seconds, then try again.";
  }
  if (status === 404) {
    return "The app will try another model automatically on retry.";
  }
  if (status && status >= 500) {
    return "If this keeps happening, try again in a few minutes.";
  }
  return undefined;
}

function mapKnownMessage(text: string): UserFacingError | null {
  const lower = text.toLowerCase();

  if (/unauthorized|sign in again/.test(lower)) {
    return {
      title: "Session expired",
      message: "Please sign out and sign back in, then open this thread again.",
      canRetry: false,
    };
  }

  if (/gemini_api_key is not set/.test(lower)) {
    return {
      title: `${BRAND_NAME} isn't configured`,
      message:
        "This app isn't connected to an AI provider yet. Contact whoever runs it to finish setup.",
      canRetry: false,
    };
  }

  if (/max output tokens|cut off/.test(lower)) {
    return {
      title: "Thread too long for one pass",
      message:
        "The story hit the output limit partway through. Try a shorter thread, or ask the app owner to raise the token limit.",
      canRetry: true,
    };
  }

  if (/stream ended without|connection lost|empty response/.test(lower)) {
    return {
      title: "Generation interrupted",
      message: "We lost the connection before the story finished.",
      hint: "Try again — your thread is still in Gmail.",
      canRetry: true,
    };
  }

  if (/invalid_grant|reconnect google|gmail connection expired/.test(lower)) {
    return {
      title: "Gmail connection expired",
      message: "Reconnect your Google account from the inbox, then try this thread again.",
      canRetry: false,
    };
  }

  if (/quota|rate limit|resource_exhausted|too many requests/.test(lower)) {
    return {
      title: "AI usage limit reached",
      message:
        "The AI provider is throttling requests right now. Please wait a moment and try again.",
      canRetry: true,
    };
  }

  if (/high demand|try again later|unavailable/.test(lower)) {
    return {
      title: "The AI is busy right now",
      message:
        "Demand is high on the AI service. This usually clears up quickly.",
      hint: "Wait a few seconds, then try again.",
      canRetry: true,
    };
  }

  if (/non-json|unexpected gemini response/.test(lower)) {
    return {
      title: "Unexpected AI response",
      message:
        "The model returned something we couldn't turn into a story. Please try again.",
      canRetry: true,
    };
  }

  return null;
}

/** Turn raw API / server errors into copy suitable for end users. */
export function formatUserFacingError(raw: unknown): UserFacingError {
  const text = normalizeRawError(raw);
  if (!text) {
    return {
      title: "Something went wrong",
      message: "We couldn't generate your story. Please try again.",
      canRetry: true,
    };
  }

  const known = mapKnownMessage(text);
  const status = extractHttpStatus(text);
  const json = tryParseJsonObject(text);
  const apiMessage = readNestedMessage(json);

  if (apiMessage && !looksTechnical(apiMessage)) {
    return {
      title: titleForStatus(status),
      message: apiMessage,
      hint: hintForStatus(status),
      canRetry: status !== 401 && status !== 403,
    };
  }

  if (known) return known;

  if (status) {
    return {
      title: titleForStatus(status),
      message:
        status === 503
          ? "The AI service is temporarily overloaded. Please try again shortly."
          : status === 429
            ? "Too many story requests in a short time. Please wait and try again."
            : "We hit a problem talking to the AI service.",
      hint: hintForStatus(status),
      canRetry: status !== 401 && status !== 403,
    };
  }

  if (!looksTechnical(text)) {
    return {
      title: "Couldn't generate your story",
      message: text,
      canRetry: true,
    };
  }

  return {
    title: "Couldn't generate your story",
    message: "Something unexpected went wrong while preparing your story.",
    hint: "Please try again. If it keeps failing, come back in a few minutes.",
    canRetry: true,
  };
}
