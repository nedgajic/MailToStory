import type { StoryColorMode, StoryDisplayTheme } from "@/lib/story-reading-theme";
import { parseStoryColorMode, parseStoryDisplayTheme } from "@/lib/story-reading-theme";

export function parseStoryDisplayThemeInput(
  value: unknown,
): StoryDisplayTheme {
  if (typeof value === "string") {
    return parseStoryDisplayTheme(value);
  }
  return "dossier";
}

export function parseStoryColorModeInput(value: unknown): StoryColorMode {
  if (typeof value === "string") {
    return parseStoryColorMode(value);
  }
  return "light";
}
