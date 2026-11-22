import type { AssetType } from "@/lib/asset-types";
import { researchLongTail } from "./long-tail";
import { bestScore, scoreAssetTypes } from "./scoring";
import { loadCompetition } from "./service";

export interface BulkRow {
  keyword: string;
  demand: number;
  competition: Partial<Record<AssetType, number>>;
  best?: { assetType: AssetType; opportunity: number };
}

async function scanOne(keyword: string): Promise<BulkRow> {
  const [longTail, competition] = await Promise.all([researchLongTail(keyword), loadCompetition(keyword)]);
  const scores = scoreAssetTypes(longTail, null, competition.map);
  const best = bestScore(scores);

  const competitionByType: Partial<Record<AssetType, number>> = {};
  for (const score of scores) if (score.competition !== null) competitionByType[score.assetType] = score.competition;

  return {
    keyword,
    demand: Math.max(...scores.map((score) => score.demand)),
    competition: competitionByType,
    best: best?.opportunity != null ? { assetType: best.assetType, opportunity: best.opportunity } : undefined,
  };
}

export async function scanKeywords(keywords: readonly string[]): Promise<BulkRow[]> {
  const rows: BulkRow[] = [];
  for (const keyword of keywords) rows.push(await scanOne(keyword));
  return rows.sort((a, b) => (b.best?.opportunity ?? -1) - (a.best?.opportunity ?? -1) || b.demand - a.demand);
}
