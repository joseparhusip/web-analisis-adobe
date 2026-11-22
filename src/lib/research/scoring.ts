import { ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { clamp } from "@/lib/utils";
import type { LongTailResult } from "./long-tail";
import type { TrendInsight } from "./trend-analysis";

export type CompetitionSource = "adobe" | "shutterstock";

export interface CompetitionEntry {
  total: number;
  source: CompetitionSource;
  observedAt: Date;
}

export type CompetitionMap = Partial<Record<AssetType, CompetitionEntry>>;

export interface AssetScore {
  assetType: AssetType;
  demand: number;
  competition: number | null;
  opportunity: number | null;
  competitionEntry?: CompetitionEntry;
}

export type OpportunityLevel = "high" | "medium" | "low";

const WEIGHTS = { trend: 0.5, suggest: 0.3, typeIntent: 0.2 } as const;
const WEIGHTS_WITHOUT_TRENDS = { suggest: 0.7, typeIntent: 0.3 } as const;
const SUGGESTIONS_FOR_FULL_SCORE = 40;
const TYPE_INTENT_FOR_FULL_SCORE = 5;
const EVERGREEN_TREND_MULTIPLIER = 1.2;
const MOMENTUM_CAP = 10;
const COMPETITION_LOG_FLOOR = 2;
const COMPETITION_LOG_RANGE = 5;
const COMPETITION_PENALTY = 0.75;
const LEVEL_THRESHOLDS = { high: 55, medium: 35 } as const;

function trendScore(insight: TrendInsight): number {
  const base = insight.isEvergreen ? insight.recentAverage * EVERGREEN_TREND_MULTIPLIER : insight.uploadWindowFit;
  const momentum = insight.yearOverYear === null ? 0 : clamp(insight.yearOverYear * 50, -MOMENTUM_CAP, MOMENTUM_CAP);
  return clamp(base + momentum);
}

function typeIntentScore(longTail: LongTailResult, assetType: AssetType): number {
  const matches = longTail.keywords.filter((item) => item.assetTypes.includes(assetType)).length;
  return clamp((matches / TYPE_INTENT_FOR_FULL_SCORE) * 100);
}

export function demandScore(longTail: LongTailResult, insight: TrendInsight | null, assetType: AssetType): number {
  const suggest = clamp((longTail.totalCandidates / SUGGESTIONS_FOR_FULL_SCORE) * 100);
  const typeIntent = typeIntentScore(longTail, assetType);

  const score = insight
    ? WEIGHTS.trend * trendScore(insight) + WEIGHTS.suggest * suggest + WEIGHTS.typeIntent * typeIntent
    : WEIGHTS_WITHOUT_TRENDS.suggest * suggest + WEIGHTS_WITHOUT_TRENDS.typeIntent * typeIntent;
  return Math.round(score);
}

export function competitionScore(total: number): number {
  const logTotal = Math.log10(Math.max(total, 1));
  return Math.round(clamp(((logTotal - COMPETITION_LOG_FLOOR) / COMPETITION_LOG_RANGE) * 100));
}

export function scoreAssetTypes(
  longTail: LongTailResult,
  insight: TrendInsight | null,
  competition: CompetitionMap,
): AssetScore[] {
  return ASSET_TYPES.map((assetType) => {
    const demand = demandScore(longTail, insight, assetType);
    const entry = competition[assetType];
    const competitionValue = entry ? competitionScore(entry.total) : null;
    const opportunity =
      competitionValue === null ? null : Math.round(demand * (1 - (COMPETITION_PENALTY * competitionValue) / 100));
    return { assetType, demand, competition: competitionValue, opportunity, competitionEntry: entry };
  });
}

export function opportunityLevel(score: number): OpportunityLevel {
  if (score >= LEVEL_THRESHOLDS.high) return "high";
  if (score >= LEVEL_THRESHOLDS.medium) return "medium";
  return "low";
}

export function bestScore(scores: readonly AssetScore[]): AssetScore | undefined {
  return scores
    .filter((score) => score.opportunity !== null)
    .reduce<AssetScore | undefined>((best, score) => (!best || score.opportunity! > best.opportunity! ? score : best), undefined);
}
