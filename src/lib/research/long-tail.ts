import { ASSET_TYPE_META, ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { keywordTokens, normalizeKeyword } from "@/lib/keyword";
import { fetchSuggestions, type SuggestChannel } from "@/lib/sources/google-suggest";

export interface LongTailKeyword {
  phrase: string;
  hits: number;
  channels: SuggestChannel[];
  assetTypes: AssetType[];
  wordCount: number;
}

export interface LongTailResult {
  keywords: LongTailKeyword[];
  totalCandidates: number;
  directSuggestionCount: number;
}

const PROBES_PER_TYPE = 3;
const YOUTUBE_PROBES = [" loop", " animation", " background"];
const RESULT_LIMIT = 12;
const MAX_PER_MODIFIER = 1;
const NOISE_WORDS = new Set([
  "png",
  "hd",
  "jpg",
  "free",
  "download",
  "website",
  "teams",
  "zoom",
  "copyright",
  "template",
  "ideas",
  "gratis",
  "terbaru",
  "gambar",
  "bergerak",
  "ucapan",
  "selamat",
  "untuk",
  "dan",
  "yang",
  "keren",
  "kartu",
  "cara",
  "membuat",
  "foto",
  "latar",
  "belakang",
  "aesthetic",
  "images",
  "pictures",
  "anime",
  "rn",
  "meme",
  "craft",
  "crochet",
  "diy",
  "recipe",
  "youtube",
  "ads",
  "tv",
  "kids",
  "pdf",
  "lyrics",
  "song",
  "songs",
  "music",
  "movie",
  "film",
  "meaning",
  "cast",
  "trailer",
  "game",
  "near",
  "chords",
  "freepik",
  "canva",
  "pinterest",
  "pngtree",
  "vecteezy",
  "shutterstock",
  "istock",
  "unsplash",
  "pixabay",
  "pexels",
  "tiktok",
]);

interface Probe {
  query: string;
  channel: SuggestChannel;
}

function buildProbes(keyword: string): Probe[] {
  const typeProbes = ASSET_TYPES.flatMap((type) =>
    ASSET_TYPE_META[type].modifiers.slice(0, PROBES_PER_TYPE).map((modifier) => `${keyword} ${modifier}`),
  );
  return [
    { query: keyword, channel: "web" },
    ...typeProbes.map((query): Probe => ({ query, channel: "web" })),
    ...YOUTUBE_PROBES.map((suffix): Probe => ({ query: `${keyword}${suffix}`, channel: "youtube" })),
  ];
}

function containsPhrase(phrase: string, fragment: string): boolean {
  return ` ${phrase} `.includes(` ${fragment} `);
}

export function classifyAssetTypes(phrase: string): AssetType[] {
  return ASSET_TYPES.filter((type) =>
    ASSET_TYPE_META[type].modifiers.some((modifier) => containsPhrase(phrase, modifier)),
  );
}

const ENTERTAINMENT_WORDS = new Set(["watch", "streaming", "where", "remover", "minutes", "outfit", "episode", "netflix", "quotes"]);
const MAX_BUYER_PHRASE_WORDS = 5;

export function isBuyerPhrase(phrase: string): boolean {
  const words = phrase.split(" ");
  const isNoise = words.some((word) => NOISE_WORDS.has(word) || ENTERTAINMENT_WORDS.has(word) || /^(19|20)\d{2}$/.test(word));
  return words.length <= MAX_BUYER_PHRASE_WORDS && !isNoise;
}

function matchesToken(word: string, token: string): boolean {
  return word === token || word === `${token}s` || `${word}s` === token;
}

function isRelevant(phrase: string, tokens: readonly string[]): boolean {
  const words = phrase.split(" ");
  const coversKeyword = tokens.every((token) => words.some((word) => matchesToken(word, token)));
  return coversKeyword && isBuyerPhrase(phrase);
}

function modifiersOf(phrase: string, tokens: readonly string[]): string[] {
  return phrase.split(" ").filter((word) => !tokens.some((token) => matchesToken(word, token)));
}

function relevanceScore(item: LongTailKeyword): number {
  const lengthBonus = item.wordCount >= 3 && item.wordCount <= 4 ? 1 : 0;
  return item.hits * 2 + item.channels.length + item.assetTypes.length + lengthBonus;
}

function curate(candidates: readonly LongTailKeyword[], tokens: readonly string[]): LongTailKeyword[] {
  const seenWordSets = new Set<string>();
  const modifierUsage = new Map<string, number>();
  const curated: LongTailKeyword[] = [];

  for (const item of [...candidates].sort((a, b) => relevanceScore(b) - relevanceScore(a))) {
    const modifiers = modifiersOf(item.phrase, tokens);
    const wordSet = [...modifiers].sort().join(" ");
    if (modifiers.length === 0 || seenWordSets.has(wordSet)) continue;
    if (modifiers.some((word) => (modifierUsage.get(word) ?? 0) >= MAX_PER_MODIFIER)) continue;

    seenWordSets.add(wordSet);
    for (const word of modifiers) modifierUsage.set(word, (modifierUsage.get(word) ?? 0) + 1);
    curated.push(item);
    if (curated.length === RESULT_LIMIT) break;
  }
  return curated;
}

export async function researchLongTail(rawKeyword: string): Promise<LongTailResult> {
  const keyword = normalizeKeyword(rawKeyword);
  const tokens = keywordTokens(keyword);
  const probes = buildProbes(keyword);
  const results = await Promise.all(probes.map((probe) => fetchSuggestions(probe.query, probe.channel)));

  const collected = new Map<string, LongTailKeyword>();
  results.forEach((suggestions, index) => {
    const { channel } = probes[index]!;
    for (const phrase of suggestions) {
      if (phrase === keyword || !isRelevant(phrase, tokens)) continue;

      const assetTypes = classifyAssetTypes(phrase);
      if (assetTypes.length === 0) continue;

      const entry = collected.get(phrase) ?? { phrase, hits: 0, channels: [], assetTypes, wordCount: phrase.split(" ").length };
      entry.hits += 1;
      if (!entry.channels.includes(channel)) entry.channels.push(channel);
      collected.set(phrase, entry);
    }
  });

  return {
    keywords: curate([...collected.values()], tokens),
    totalCandidates: collected.size,
    directSuggestionCount: results[0]?.filter((phrase) => phrase !== keyword).length ?? 0,
  };
}
