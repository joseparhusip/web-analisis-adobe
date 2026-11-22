import { buildScoreboard } from "@/lib/research/service";
import { findSavedKeyword, storeScoreSnapshot } from "./repository";

export async function refreshSavedKeywordScore(keyword: string): Promise<void> {
  if (!(await findSavedKeyword(keyword))) return;
  const { scores } = await buildScoreboard(keyword);
  await storeScoreSnapshot(keyword, scores);
}
