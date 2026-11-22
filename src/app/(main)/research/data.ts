import { cache } from "react";
import { researchLongTail } from "@/lib/research/long-tail";
import { scoreAssetTypes } from "@/lib/research/scoring";
import { loadCompetition, loadTrends } from "@/lib/research/service";

export const getLongTail = cache((keyword: string) => researchLongTail(keyword));

export const getTrends = cache((keyword: string) => loadTrends(keyword));

export const getCompetition = cache((keyword: string) => loadCompetition(keyword));

export const getScores = cache(async (keyword: string) => {
  const [longTail, trends, competition] = await Promise.all([
    getLongTail(keyword),
    getTrends(keyword),
    getCompetition(keyword),
  ]);
  return scoreAssetTypes(longTail, trends.status === "ok" ? trends.insight : null, competition.map);
});
