"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordObservation } from "@/lib/adobe/observations";
import { generateBrief, type StoredBrief } from "@/lib/ai/brief-service";
import { GeminiError } from "@/lib/ai/gemini";
import { generateNiches, type NicheReport } from "@/lib/ai/niche-service";
import { isPromptCount } from "@/lib/ai/prompt-options";
import { ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { refreshSavedKeywordScore } from "@/lib/keywords/refresh";
import { saveKeyword } from "@/lib/keywords/repository";

export interface ActionState {
  ok: boolean;
  message: string;
}

const keywordSchema = z.string().trim().min(1, "Keyword kosong").max(120);

const saveSchema = z.object({
  keyword: keywordSchema,
  tags: z.string().default(""),
});

const manualCountSchema = z.object({
  keyword: keywordSchema,
  assetType: z.enum(ASSET_TYPES),
  total: z.string().transform((raw, context) => {
    const value = Number(raw.replace(/[^\d]/g, ""));
    if (!raw.trim() || !Number.isSafeInteger(value)) {
      context.addIssue({ code: "custom", message: "Jumlah aset tidak valid" });
      return z.NEVER;
    }
    return value;
  }),
});

function revalidateKeywordViews(): void {
  revalidatePath("/research");
  revalidatePath("/keywords");
  revalidatePath("/");
}

export async function saveKeywordAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = saveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const { keyword, tags } = parsed.data;
  await saveKeyword(keyword, tags.split(","));
  await refreshSavedKeywordScore(keyword);
  revalidateKeywordViews();
  return { ok: true, message: "Tersimpan di database keyword" };
}

export type BriefActionResult = { ok: true; stored: StoredBrief } | { ok: false; message: string };

const briefSchema = z.object({
  keyword: keywordSchema,
  assetType: z.enum(ASSET_TYPES),
  count: z.number().refine(isPromptCount, "Jumlah prompt tidak valid"),
});

export async function generateBriefAction(
  keyword: string,
  assetType: AssetType,
  count: number,
): Promise<BriefActionResult> {
  const parsed = briefSchema.safeParse({ keyword, assetType, count });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  try {
    const { keyword: validKeyword, assetType: validType, count: validCount } = parsed.data;
    return { ok: true, stored: await generateBrief(validKeyword, validType, validCount) };
  } catch (error) {
    if (error instanceof GeminiError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: "Gagal membuat analisis. Coba generate ulang." };
  }
}

export type NicheActionResult = { ok: true; report: NicheReport } | { ok: false; message: string };

const nicheSchema = z.object({ keyword: keywordSchema, focus: z.string().trim().max(80).optional() });

export async function generateNichesAction(keyword: string, focus?: string): Promise<NicheActionResult> {
  const parsed = nicheSchema.safeParse({ keyword, focus });
  if (!parsed.success) return { ok: false, message: "Input tidak valid" };

  try {
    return { ok: true, report: await generateNiches(parsed.data.keyword, parsed.data.focus || undefined) };
  } catch (error) {
    if (error instanceof GeminiError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: "Gagal menganalisis niche. Coba lagi." };
  }
}

export async function recordManualCountAction(_: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = manualCountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const { keyword, assetType, total } = parsed.data;
  await recordObservation({ keyword, assetType, total, order: "relevance", source: "manual" });
  await refreshSavedKeywordScore(keyword);
  revalidateKeywordViews();
  return { ok: true, message: "Tersimpan" };
}
