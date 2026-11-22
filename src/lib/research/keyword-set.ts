import { keywordTokens } from "@/lib/keyword";
import type { LongTailKeyword } from "./long-tail";
import type { TitlePattern } from "./title-patterns";

export const ADOBE_KEYWORD_LIMIT = 49;

export function buildKeywordSet(
  keyword: string,
  patterns: readonly TitlePattern[],
  longTail: readonly LongTailKeyword[],
): string[] {
  const ordered = [
    ...keywordTokens(keyword),
    ...patterns.filter((pattern) => !pattern.phrase.includes(" ")).map((pattern) => pattern.phrase),
    ...longTail.flatMap((item) => item.phrase.split(" ")),
  ];
  return [...new Set(ordered.filter((word) => word.length > 1))].slice(0, ADOBE_KEYWORD_LIMIT);
}
