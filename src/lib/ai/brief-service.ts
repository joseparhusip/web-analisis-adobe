import { getAdobeKeywordData } from "@/lib/adobe/observations";
import { ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { peekCache, writeCache } from "@/lib/cache";
import { normalizeKeyword } from "@/lib/keyword";
import { buildScoreboard } from "@/lib/research/service";
import { extractTitlePatterns } from "@/lib/research/title-patterns";
import { buildBriefPrompt, buildSystemInstruction, type CreativeBrief, parseCreativeBrief } from "./creative-brief";
import { type GroundingSource, generateWithSearch } from "./gemini";
import { currentWorkspaceId } from "@/lib/workspace/context";
import { buildResearchContext } from "./research-context";

export interface StoredBrief {
  brief: CreativeBrief;
  model: string;
  sources: GroundingSource[];
  grounded?: boolean;
  generatedAt: string;
}

export type StoredBriefs = Partial<Record<AssetType, StoredBrief>>;

const cacheKey = async (keyword: string, assetType: AssetType) =>
  `brief:${await currentWorkspaceId()}:${assetType}:${normalizeKeyword(keyword)}`;

export async function buildContextFor(keyword: string): Promise<string> {
  const [scoreboard, adobe] = await Promise.all([buildScoreboard(keyword), getAdobeKeywordData(keyword)]);
  const titles = Object.values(adobe.bestSellers).flatMap((entry) => entry.samples.map((sample) => sample.title));
  return buildResearchContext(keyword, scoreboard, extractTitlePatterns(titles, keyword));
}

export async function getStoredBriefs(keyword: string): Promise<StoredBriefs> {
  const entries = await Promise.all(
    ASSET_TYPES.map(async (type) => [type, (await peekCache<StoredBrief>(await cacheKey(keyword, type)))?.value] as const),
  );
  return Object.fromEntries(entries.filter(([, stored]) => stored !== undefined));
}

export async function generateBrief(keyword: string, assetType: AssetType, count: number): Promise<StoredBrief> {
  const context = await buildContextFor(keyword);
  const result = await generateWithSearch(
    buildSystemInstruction(assetType, count),
    buildBriefPrompt(context, assetType, count),
  );
  const stored: StoredBrief = {
    brief: parseCreativeBrief(result.text, assetType, count),
    model: result.model,
    sources: result.sources,
    grounded: result.grounded,
    generatedAt: new Date().toISOString(),
  };
  await writeCache(await cacheKey(keyword, assetType), stored);
  return stored;
}
