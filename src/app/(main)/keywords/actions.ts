"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refreshSavedKeywordScore } from "@/lib/keywords/refresh";
import { removeKeyword, updateKeywordTags } from "@/lib/keywords/repository";

const idSchema = z.number().int().positive();

function revalidateKeywordViews(): void {
  revalidatePath("/keywords");
  revalidatePath("/");
}

export async function removeKeywordAction(id: number): Promise<void> {
  await removeKeyword(idSchema.parse(id));
  revalidateKeywordViews();
}

export async function updateTagsAction(id: number, rawTags: string): Promise<void> {
  await updateKeywordTags(idSchema.parse(id), z.string().max(500).parse(rawTags).split(","));
  revalidateKeywordViews();
}

export async function refreshScoreAction(keyword: string): Promise<void> {
  await refreshSavedKeywordScore(z.string().min(1).parse(keyword));
  revalidateKeywordViews();
}
