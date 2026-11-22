import { ASSET_TYPES } from "@/lib/asset-types";
import { type AdobeKeywordData, getAdobeKeywordData } from "@/lib/adobe/observations";
import { fetchShutterstockTotals, isShutterstockConfigured } from "@/lib/sources/shutterstock";
import { fetchTrends, type TrendsData, TrendsUnavailableError } from "@/lib/sources/google-trends";
import { isBuyerPhrase, researchLongTail, type LongTailResult } from "./long-tail";
import { type AssetScore, type CompetitionMap, scoreAssetTypes } from "./scoring";
import { analyzeTrends, type TrendInsight } from "./trend-analysis";

export type TrendsResult =
  | { status: "ok"; data: TrendsData; insight: TrendInsight }
  | { status: "unavailable"; retryAt: Date | null };

export interface CompetitionResult {
  map: CompetitionMap;
  adobe: AdobeKeywordData;
  shutterstockConfigured: boolean;
}

export interface Scoreboard {
  longTail: LongTailResult;
  trends: TrendsResult;
  competition: CompetitionResult;
  scores: AssetScore[];
}

export async function loadTrends(keyword: string, today = new Date()): Promise<TrendsResult> {
  try {
    const raw = await fetchTrends(keyword);
    if (raw.timeline.length === 0) return { status: "unavailable", retryAt: null };

    const data = {
      ...raw,
      topQueries: raw.topQueries.filter(isBuyerPhrase),
      risingQueries: raw.risingQueries.filter(isBuyerPhrase),
    };
    return { status: "ok", data, insight: analyzeTrends(data.timeline, today) };
  } catch (error) {
    if (error instanceof TrendsUnavailableError) return { status: "unavailable", retryAt: error.retryAt };
    console.error(error);
    return { status: "unavailable", retryAt: null };
  }
}

export async function loadCompetition(keyword: string): Promise<CompetitionResult> {
  const [adobe, shutterstock, shutterstockConfigured] = await Promise.all([
    getAdobeKeywordData(keyword),
    fetchShutterstockTotals(keyword).catch((error: unknown) => {
      console.error(error);
      return null;
    }),
    isShutterstockConfigured(),
  ]);

  const map: CompetitionMap = {};
  for (const type of ASSET_TYPES) {
    const adobeTotal = adobe.totals[type];
    if (adobeTotal) {
      map[type] = { total: adobeTotal.total, source: "adobe", observedAt: adobeTotal.observedAt };
    } else if (shutterstock) {
      map[type] = { total: shutterstock[type], source: "shutterstock", observedAt: new Date() };
    }
  }

  return { map, adobe, shutterstockConfigured };
}

export async function buildScoreboard(keyword: string): Promise<Scoreboard> {
  const [longTail, trends, competition] = await Promise.all([
    researchLongTail(keyword),
    loadTrends(keyword),
    loadCompetition(keyword),
  ]);
  const insight = trends.status === "ok" ? trends.insight : null;
  return { longTail, trends, competition, scores: scoreAssetTypes(longTail, insight, competition.map) };
}
