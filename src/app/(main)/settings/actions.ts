"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { testConnection } from "@/lib/ai/generate";
import { isPromptCount } from "@/lib/ai/prompt-options";
import { getProvider, PROVIDERS } from "@/lib/ai/providers";
import {
  CREATIVITY_MODES,
  type CreativityMode,
  SEARCH_MODES,
  type SearchMode,
  saveSettings,
  type StoredSettings,
} from "@/lib/settings/settings";

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
  aiProvider: z.enum(Object.keys(PROVIDERS) as [string, ...string[]]),
  aiModel: z.string().trim().max(100),
  apiKey: optionalSecret,
  clearApiKey: z.literal("on").optional(),
  searchMode: z.enum(Object.keys(SEARCH_MODES) as [SearchMode, ...SearchMode[]]),
  creativity: z.enum(Object.keys(CREATIVITY_MODES) as [CreativityMode, ...CreativityMode[]]),
  defaultPromptCount: z.coerce.number().refine(isPromptCount, "Jumlah prompt tidak valid"),
  shutterstockClientId: z.string().trim().max(200),
  shutterstockClientSecret: optionalSecret,
});

export async function saveSettingsAction(_: SettingsActionState | null, formData: FormData): Promise<SettingsActionState> {
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };

  const { aiProvider, aiModel, apiKey, clearApiKey, shutterstockClientSecret, shutterstockClientId, searchMode, creativity, defaultPromptCount } =
    parsed.data;
  const keyField = getProvider(aiProvider).keyField;

  const patch: StoredSettings = { aiProvider, aiModel, searchMode, creativity, defaultPromptCount, shutterstockClientId };
  if (clearApiKey) patch[keyField] = "";
  else if (apiKey) patch[keyField] = apiKey;
  if (shutterstockClientSecret) patch.shutterstockClientSecret = shutterstockClientSecret;

  await saveSettings(patch);
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan tersimpan" };
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
}

export async function testAiAction(providerId: string, typedKey: string, model: string): Promise<ConnectionResult> {
  if (!typedKey.trim()) return { ok: false, message: "Isi API key dulu" };
  return testConnection(providerId, typedKey.trim(), model);
}
