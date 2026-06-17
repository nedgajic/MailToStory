import { describe, expect, it } from "vitest";
import {
  extractJsonObjectFromModelText,
  tryParseModelJsonObject,
} from "@/lib/extract-json";

describe("extractJsonObjectFromModelText", () => {
  it("strips markdown fences", () => {
    const raw = "```json\n{\"a\":1}\n```";
    expect(extractJsonObjectFromModelText(raw)).toBe('{"a":1}');
  });

  it("extracts object from noisy text", () => {
    const raw = 'Here you go: {"ok":true} trailing';
    expect(extractJsonObjectFromModelText(raw)).toBe('{"ok":true}');
  });

  it("does not terminate on } inside a string value", () => {
    const inner = '{"msg":"He said } ok","n":1}';
    const raw = `prefix ${inner} suffix`;
    expect(extractJsonObjectFromModelText(raw)).toBe(inner);
  });
});

describe("tryParseModelJsonObject", () => {
  it("parses raw object JSON", () => {
    expect(tryParseModelJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses fenced JSON", () => {
    const raw = "```json\n{\"ok\":true}\n```";
    expect(tryParseModelJsonObject(raw)).toEqual({ ok: true });
  });

  it("extracts object from preamble text", () => {
    expect(
      tryParseModelJsonObject('Sure, here: {"title":"x","chips":[]}'),
    ).toEqual({ title: "x", chips: [] });
  });

  it("parses double-encoded JSON string payload", () => {
    const inner = JSON.stringify({ nested: true });
    const wrapped = JSON.stringify(inner);
    expect(tryParseModelJsonObject(wrapped)).toEqual({ nested: true });
  });

  it("returns null for invalid JSON", () => {
    expect(tryParseModelJsonObject("not json")).toBeNull();
    expect(tryParseModelJsonObject("")).toBeNull();
  });

  it("returns null for JSON array at root", () => {
    expect(tryParseModelJsonObject("[1,2]")).toBeNull();
  });
});
