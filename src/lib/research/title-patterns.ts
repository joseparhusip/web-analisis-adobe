import { keywordTokens } from "@/lib/keyword";

export interface TitlePattern {
  phrase: string;
  count: number;
  share: number;
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "it", "its", "of",
  "on", "or", "the", "to", "with", "without", "over", "under", "this", "that", "these", "your", "our", "you", "we",
]);
const MAX_PATTERNS = 24;
const MIN_SHARE = 0.05;

function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
}

function phrasesOf(words: readonly string[], excluded: ReadonlySet<string>): Set<string> {
  const phrases = new Set<string>();
  words.forEach((word, index) => {
    if (!excluded.has(word)) phrases.add(word);
    const next = words[index + 1];
    if (next && !(excluded.has(word) && excluded.has(next))) phrases.add(`${word} ${next}`);
  });
  return phrases;
}

export function extractTitlePatterns(titles: readonly string[], keyword: string): TitlePattern[] {
  if (titles.length === 0) return [];

  const excluded = new Set(keywordTokens(keyword));
  const counts = new Map<string, number>();
  for (const title of titles) {
    for (const phrase of phrasesOf(tokenize(title), excluded)) counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  const minimumCount = Math.max(2, Math.ceil(titles.length * MIN_SHARE));
  return [...counts.entries()]
    .filter(([, count]) => count >= minimumCount)
    .sort(([phraseA, countA], [phraseB, countB]) => countB - countA || phraseA.length - phraseB.length)
    .slice(0, MAX_PATTERNS)
    .map(([phrase, count]) => ({ phrase, count, share: count / titles.length }));
}
