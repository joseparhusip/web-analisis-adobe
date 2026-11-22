"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GeminiError, listGeminiModels } from "@/lib/ai/gemini";
import { isPromptCount } from "@/lib/ai/prompt-options";
import { CREATIVITY_MODES, type CreativityMode, getSettings, SEARCH_MODES, type SearchMode, saveSettings } from "@/lib/settings/settings";

export interface SettingsActionState {
  ok: boolean;
  message: string;
}

const optionalSecret = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || undefined);

const formSchema = z.object({
  geminiApiKey: optionalSecret,
  clearGeminiApiKey: z.literal("on").optional(),
  geminiModel: z.string().trim().max(100),
  geminiFallbackModel: z.string().trim().max(100),
  searchMode: z.enum(Object.keys(SEARCH_MODES) as [SearchMode, ...SearchMode[]]),
  creativity: z.enum(Object.keys(CREATIVITY_MODES) as [CreativityMode, ...CreativityMode[]]),
  defaultPromptCount: z.coerce.number().refine(isPromptCount, "Jumlah prompt tidak valid"),
  shutterstockClientId: z.string().trim().max(200),
  shutterstockClientSecret: optionalSecret,
});

export async function saveSettingsAction(_: SettingsActionState | null, formData: FormData): Promise<SettingsActionState> {
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const { geminiApiKey, clearGeminiApiKey, shutterstockClientSecret, ...rest } = parsed.data;
  await saveSettings({
    ...rest,
    ...(clearGeminiApiKey ? { geminiApiKey: "" } : geminiApiKey && { geminiApiKey }),
    ...(shutterstockClientSecret && { shutterstockClientSecret }),
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan tersimpan" };
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
}

export async function testGeminiAction(typedKey: string): Promise<ConnectionResult> {
  const apiKey = typedKey.trim() || (await getSettings()).geminiApiKey;
  if (!apiKey) return { ok: false, message: "Isi API key dulu" };

  try {
    const models = await listGeminiModels(apiKey);
    return { ok: true, message: `Terhubung. ${models.length} model Gemini tersedia.` };
  } catch (error) {
    return { ok: false, message: error instanceof GeminiError ? error.message : "Tidak bisa menghubungi Gemini" };
  }
}
