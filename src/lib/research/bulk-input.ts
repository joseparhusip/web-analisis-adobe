import { normalizeKeyword } from "@/lib/keyword";

export const MAX_BULK_KEYWORDS = 25;

export function parseKeywordInput(raw: string): string[] {
  const keywords = raw
    .split(/[\n,;]+/)
    .map(normalizeKeyword)
    .filter((keyword) => keyword.length > 1);
  return [...new Set(keywords)].slice(0, MAX_BULK_KEYWORDS);
}
