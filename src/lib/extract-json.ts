/**
 * Pull a single JSON object from model text (fences, preamble, trailing junk).
 * Uses brace depth with string/escape awareness so `}` inside strings does not end early.
 */
export function extractJsonObjectFromModelText(raw: string): string {
  let text = raw.trim().replace(/^\uFEFF/, "");
  const fence = /^```(?:json)?\s*([\s\S]*?)```/im.exec(text);
  if (fence?.[1]) text = fence[1].trim();

  const start = text.indexOf("{");
  if (start === -1) return text;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }
  }

  const lastBrace = text.lastIndexOf("}");
  if (lastBrace > start) {
    return text.slice(start, lastBrace + 1);
  }
  return text;
}

/**
 * Parse model output into a JSON object (or null). Handles fences, noise,
 * double-encoded JSON strings, and duplicate parse strategies used by Gemini.
 */
export function tryParseModelJsonObject(raw: string): unknown | null {
  const t = raw.trim().replace(/^\uFEFF/, "");
  if (!t) return null;

  const tryParse = (s: string): unknown => JSON.parse(s);

  const asObject = (v: unknown): unknown | null =>
    v !== null && typeof v === "object" && !Array.isArray(v) ? v : null;

  try {
    const v = tryParse(t);
    const obj0 = asObject(v);
    if (obj0) return obj0;
    if (typeof v === "string") {
      const s = v.trim();
      try {
        const obj1 = asObject(tryParse(s));
        if (obj1) return obj1;
      } catch {
        /* continue */
      }
      try {
        const slice = extractJsonObjectFromModelText(s);
        const obj2 = asObject(tryParse(slice));
        if (obj2) return obj2;
      } catch {
        /* continue */
      }
    }
  } catch {
    /* continue */
  }

  try {
    const slice = extractJsonObjectFromModelText(t);
    const v = tryParse(slice);
    const obj = asObject(v);
    if (obj) return obj;
  } catch {
    /* continue */
  }

  return null;
}
