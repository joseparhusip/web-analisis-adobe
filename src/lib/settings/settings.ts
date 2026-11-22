import { eq } from "drizzle-orm";
import { z } from "zod";
import { DEFAULT_PROMPT_COUNT, MAX_PROMPT_COUNT } from "@/lib/ai/prompt-options";
import { getDb } from "@/lib/db/client";
import { appSettings } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { currentWorkspaceId } from "@/lib/workspace/context";

export const CREATIVITY_MODES = {
  precise: { label: "Akurat", description: "Konsisten, mengikuti data", temperature: 0.3 },
  balanced: { label: "Seimbang", description: "Disarankan", temperature: 0.7 },
  creative: { label: "Kreatif", description: "Ide lebih beragam", temperature: 1.0 },
} as const;

export const SEARCH_MODES = {
  auto: "Pakai Google Search jika kuota tersedia",
  off: "Jangan pakai Google Search",
} as const;

export type CreativityMode = keyof typeof CREATIVITY_MODES;
export type SearchMode = keyof typeof SEARCH_MODES;


export const storedSettingsSchema = z
  .object({
    geminiApiKey: z.string(),
    geminiModel: z.string(),
    geminiFallbackModel: z.string(),
    searchMode: z.enum(Object.keys(SEARCH_MODES) as [SearchMode, ...SearchMode[]]),
    creativity: z.enum(Object.keys(CREATIVITY_MODES) as [CreativityMode, ...CreativityMode[]]),
    defaultPromptCount: z.number().int().min(1).max(MAX_PROMPT_COUNT),
    shutterstockClientId: z.string(),
    shutterstockClientSecret: z.string(),
  })
  .partial();

export type StoredSettings = z.infer<typeof storedSettingsSchema>;

export interface AppSettings {
  geminiApiKey?: string;
  geminiApiKeySource: "settings" | "env" | "none";
  geminiModel?: string;
  geminiFallbackModels: string[];
  searchMode: SearchMode;
  creativity: CreativityMode;
  defaultPromptCount: number;
  shutterstockClientId?: string;
  shutterstockClientSecret?: string;
}

async function readStored(): Promise<StoredSettings> {
  const db = await getDb();
  const [row] = await db.select().from(appSettings).where(eq(appSettings.id, await currentWorkspaceId())).limit(1);
  const parsed = storedSettingsSchema.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : {};
}

const present = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

export async function getSettings(): Promise<AppSettings> {
  const stored = await readStored();
  const storedKey = present(stored.geminiApiKey);
  const geminiApiKey = storedKey ?? env.GEMINI_API_KEY;
  const fallback = stored.geminiFallbackModel === undefined ? env.GEMINI_FALLBACK_MODELS : [stored.geminiFallbackModel];

  return {
    geminiApiKey,
    geminiApiKeySource: storedKey ? "settings" : geminiApiKey ? "env" : "none",
    geminiModel: stored.geminiModel === undefined ? env.GEMINI_MODEL : present(stored.geminiModel),
    geminiFallbackModels: fallback.filter(Boolean),
    searchMode: stored.searchMode ?? "auto",
    creativity: stored.creativity ?? "balanced",
    defaultPromptCount: stored.defaultPromptCount ?? DEFAULT_PROMPT_COUNT,
    shutterstockClientId: present(stored.shutterstockClientId) ?? env.SHUTTERSTOCK_CLIENT_ID,
    shutterstockClientSecret: present(stored.shutterstockClientSecret) ?? env.SHUTTERSTOCK_CLIENT_SECRET,
  };
}

export async function saveSettings(patch: StoredSettings): Promise<void> {
  const db = await getDb();
  const value = { ...(await readStored()), ...patch };
  const updatedAt = new Date();
  await db
    .insert(appSettings)
    .values({ id: await currentWorkspaceId(), value, updatedAt })
    .onConflictDoUpdate({ target: appSettings.id, set: { value, updatedAt } });
}

export function maskSecret(secret: string | undefined): string | undefined {
  return secret ? `••••••••${secret.slice(-4)}` : undefined;
}
