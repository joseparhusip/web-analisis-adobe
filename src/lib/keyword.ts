export function normalizeKeyword(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

export function keywordTokens(keyword: string): string[] {
  return normalizeKeyword(keyword).split(" ").filter(Boolean);
}
