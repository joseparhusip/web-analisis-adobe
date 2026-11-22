import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { type SavedKeyword, savedKeywords } from "@/lib/db/schema";
import { normalizeKeyword } from "@/lib/keyword";
import { type AssetScore, bestScore } from "@/lib/research/scoring";
import { currentWorkspaceId } from "@/lib/workspace/context";

export function normalizeTags(raw: readonly string[]): string[] {
  return [...new Set(raw.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export async function listSavedKeywords(): Promise<SavedKeyword[]> {
  const db = await getDb();
  return db
    .select()
    .from(savedKeywords)
    .where(eq(savedKeywords.workspaceId, await currentWorkspaceId()))
    .orderBy(desc(savedKeywords.bestScore), desc(savedKeywords.createdAt));
}

export async function findSavedKeyword(keyword: string): Promise<SavedKeyword | undefined> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(savedKeywords)
    .where(and(eq(savedKeywords.workspaceId, await currentWorkspaceId()), eq(savedKeywords.keyword, normalizeKeyword(keyword))))
    .limit(1);
  return row;
}

export async function saveKeyword(keyword: string, tags: readonly string[]): Promise<void> {
  const db = await getDb();
  const normalizedTags = normalizeTags(tags);
  await db
    .insert(savedKeywords)
    .values({ workspaceId: await currentWorkspaceId(), keyword: normalizeKeyword(keyword), tags: normalizedTags, createdAt: new Date() })
    .onConflictDoUpdate({ target: [savedKeywords.workspaceId, savedKeywords.keyword], set: { tags: normalizedTags } });
}

export async function updateKeywordTags(id: number, tags: readonly string[]): Promise<void> {
  const db = await getDb();
  await db
    .update(savedKeywords)
    .set({ tags: normalizeTags(tags) })
    .where(and(eq(savedKeywords.workspaceId, await currentWorkspaceId()), eq(savedKeywords.id, id)));
}

export async function removeKeyword(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(savedKeywords).where(and(eq(savedKeywords.workspaceId, await currentWorkspaceId()), eq(savedKeywords.id, id)));
}

export async function storeScoreSnapshot(keyword: string, scores: readonly AssetScore[]): Promise<void> {
  const db = await getDb();
  const best = bestScore(scores);
  await db
    .update(savedKeywords)
    .set({
      bestAssetType: best?.assetType ?? null,
      bestScore: best?.opportunity ?? null,
      scores: Object.fromEntries(scores.map((score) => [score.assetType, score.opportunity])),
      scoredAt: new Date(),
    })
    .where(and(eq(savedKeywords.workspaceId, await currentWorkspaceId()), eq(savedKeywords.keyword, normalizeKeyword(keyword))));
}
