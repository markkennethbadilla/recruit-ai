/**
 * Robust JSON extraction from LLM responses.
 * Handles markdown fences, leading/trailing text, and common LLM quirks.
 */

/**
 * Extract valid JSON from an LLM response string.
 * Tries multiple strategies:
 * 1. Direct parse (response is pure JSON)
 * 2. Strip markdown code fences
 * 3. Find first { ... } or [ ... ] block via brace matching
 * 4. Throw descriptive error if nothing works
 */
export function extractJSON<T = unknown>(raw: string): T {
  const trimmed = raw.trim();

  // Strategy 1: direct parse
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }

  // Strategy 2: strip markdown fences
  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(fenceStripped) as T;
  } catch {
    // continue
  }

  // Strategy 3: find first balanced { } or [ ] block
  const jsonBlock = findBalancedJSON(trimmed);
  if (jsonBlock) {
    try {
      return JSON.parse(jsonBlock) as T;
    } catch {
      // continue
    }
  }

  // Strategy 4: aggressive cleanup — remove everything outside outermost braces
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const aggressive = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(aggressive) as T;
    } catch {
      // continue
    }
  }

  throw new Error(
    `Failed to extract valid JSON from AI response. Raw output starts with: "${trimmed.substring(0, 120)}..."`
  );
}

/**
 * Find the first balanced JSON block ({...} or [...]) in a string.
 * Uses brace-depth tracking, respecting strings.
 */
function findBalancedJSON(text: string): string | null {
  let start = -1;
  let openChar = "";
  let closeChar = "";

  // Find first { or [
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      start = i;
      openChar = "{";
      closeChar = "}";
      break;
    }
    if (text[i] === "[") {
      start = i;
      openChar = "[";
      closeChar = "]";
      break;
    }
  }

  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === openChar) depth++;
    if (ch === closeChar) depth--;

    if (depth === 0) {
      return text.substring(start, i + 1);
    }
  }

  return null;
}
