import { z } from "zod";
import { CREATIVITY_MODES, getSettings, type SearchMode } from "@/lib/settings/settings";
import { singleton } from "@/lib/singleton";
import { HOUR } from "@/lib/time";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_CACHE_MS = 6 * HOUR;
const SEARCH_BLOCK_MS = HOUR;
const REQUEST_TIMEOUT_MS = 90_000;
const UNRESPONSIVE_STATUS = 503;
const MODEL_PATTERN = /^models\/(gemini-(\d+(?:\.\d+)?)-(flash|pro)(?:-(.+))?)$/;
const AUTO_EXCLUDED_VARIANTS = /image|tts|audio|live|embedding|lite|thinking|computer|robotics|native/;
const LISTING_EXCLUDED = /image|banana|tts|audio|live|embedding|computer|robotics|native/;
const TIER_PRIORITY = { flash: 0, pro: 1 } as const;
const RETRYABLE_STATUSES = new Set([404, 429, 500, 503]);

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }

  get canTryAnotherModel(): boolean {
    return this.status !== undefined && RETRYABLE_STATUSES.has(this.status);
  }
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeminiResult {
  text: string;
  model: string;
  sources: GroundingSource[];
  grounded: boolean;
}

export interface GeminiModelOption {
  id: string;
  displayName: string;
}

interface GeminiConfig {
  apiKey: string;
  model?: string;
  fallbackModels: string[];
  searchMode: SearchMode;
  temperature: number;
}

const modelListSchema = z.object({
  models: z
    .array(
      z.object({
        name: z.string(),
        displayName: z.string().default(""),
        supportedGenerationMethods: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

const generateSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({ parts: z.array(z.object({ text: z.string().optional() })).default([]) }).optional(),
        groundingMetadata: z
          .object({
            groundingChunks: z
              .array(z.object({ web: z.object({ uri: z.string(), title: z.string().default("") }).optional() }))
              .default([]),
          })
          .optional(),
      }),
    )
    .default([]),
});

const errorSchema = z.object({ error: z.object({ message: z.string() }) });

const FRIENDLY_ERRORS: [RegExp, string][] = [
  [/api key not valid|api_key_invalid/i, "API key tidak valid. Cek lagi key dari aistudio.google.com."],
  [/permission|forbidden/i, "API key tidak punya izin untuk Gemini API."],
  [/quota|rate limit/i, "Kuota Gemini habis atau kena batas. Coba lagi nanti atau ganti model."],
  [/not found/i, "Model tidak ditemukan. Pilih model lain di Pengaturan."],
];

function friendlyMessage(message: string): string {
  return FRIENDLY_ERRORS.find(([pattern]) => pattern.test(message))?.[1] ?? message;
}

const FLASH_FAMILY_PATTERN = /^models\/(gemini-(\d+(?:\.\d+)?)-flash(?:-lite)?)$/;
const QUOTA_PAUSE_MS = 30 * 60_000;
const OVERLOAD_PAUSE_MS = 15 * 60_000;

const discoveredModels = singleton("gemini-models", () => new Map<string, { id: string; resolvedAt: number }>());
const flashFamilies = singleton("gemini-flash-families", () => new Map<string, { models: string[]; resolvedAt: number }>());
const unavailableModels = singleton("gemini-unavailable", () => new Map<string, number>());
const searchBlocks = singleton("gemini-search-blocks", () => new Map<string, number>());

export async function isGeminiConfigured(): Promise<boolean> {
  return Boolean((await getSettings()).geminiApiKey);
}

async function loadConfig(): Promise<GeminiConfig> {
  const settings = await getSettings();
  if (!settings.geminiApiKey) throw new GeminiError("API key Gemini belum diisi. Buka menu Pengaturan.");
  return {
    apiKey: settings.geminiApiKey,
    model: settings.geminiModel,
    fallbackModels: settings.geminiFallbackModels,
    searchMode: settings.searchMode,
    temperature: CREATIVITY_MODES[settings.creativity].temperature,
  };
}

async function callApi(apiKey: string, path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${API_BASE}/${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey, ...init.headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).catch(() => {
    throw new GeminiError("Gemini tidak merespons. Coba lagi atau ganti model di Pengaturan.", UNRESPONSIVE_STATUS);
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(body);
    const message = parsed.success ? friendlyMessage(parsed.data.error.message) : `Gemini API error ${response.status}`;
    throw new GeminiError(message, response.status);
  }
  return body;
}

async function fetchModels(apiKey: string) {
  const { models } = modelListSchema.parse(await callApi(apiKey, "models?pageSize=1000"));
  return models.filter((model) => model.supportedGenerationMethods.includes("generateContent"));
}

export async function listGeminiModels(apiKey: string): Promise<GeminiModelOption[]> {
  return (await fetchModels(apiKey))
    .filter((model) => model.name.startsWith("models/gemini-") && !LISTING_EXCLUDED.test(model.name))
    .map((model) => {
      const id = model.name.replace(/^models\//, "");
      return { id, displayName: model.displayName || id };
    })
    .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
}

interface RankedModel {
  id: string;
  version: number;
  tier: keyof typeof TIER_PRIORITY;
  isStable: boolean;
}

function rankModel(name: string): RankedModel | undefined {
  const match = MODEL_PATTERN.exec(name);
  if (!match) return undefined;

  const [, id, version, tier, variant = ""] = match;
  if (AUTO_EXCLUDED_VARIANTS.test(variant)) return undefined;
  return {
    id: id!,
    version: Number(version),
    tier: tier as RankedModel["tier"],
    isStable: variant === "" || /^\d+$/.test(variant),
  };
}

function compareModels(a: RankedModel, b: RankedModel): number {
  return (
    TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier] ||
    b.version - a.version ||
    Number(b.isStable) - Number(a.isStable) ||
    a.id.localeCompare(b.id)
  );
}

async function discoverModel(apiKey: string): Promise<string> {
  const cached = discoveredModels.get(apiKey);
  if (cached && Date.now() - cached.resolvedAt < MODEL_CACHE_MS) return cached.id;

  const [best] = (await fetchModels(apiKey))
    .map((model) => rankModel(model.name))
    .filter((model): model is RankedModel => model !== undefined)
    .sort(compareModels);
  if (!best) throw new GeminiError("Tidak ada model Gemini yang cocok di akun ini");

  discoveredModels.set(apiKey, { id: best.id, resolvedAt: Date.now() });
  return best.id;
}

function versionOf(model: string): number {
  return Number(FLASH_FAMILY_PATTERN.exec(`models/${model}`)?.[2] ?? 0);
}

async function freeFlashModels(apiKey: string, primary: string): Promise<string[]> {
  const cached = flashFamilies.get(apiKey);
  const family =
    cached && Date.now() - cached.resolvedAt < MODEL_CACHE_MS
      ? cached.models
      : (await fetchModels(apiKey).catch(() => []))
          .map((model) => FLASH_FAMILY_PATTERN.exec(model.name)?.[1])
          .filter((id): id is string => id !== undefined);
  flashFamilies.set(apiKey, { models: family, resolvedAt: cached?.resolvedAt ?? Date.now() });

  const primaryVersion = versionOf(primary);
  const isNewer = (model: string) => versionOf(model) > primaryVersion;
  return [...family].sort(
    (a, b) => Number(isNewer(a)) - Number(isNewer(b)) || versionOf(b) - versionOf(a) || a.length - b.length,
  );
}

async function candidateModels(config: GeminiConfig): Promise<string[]> {
  const primary = config.model ?? (await discoverModel(config.apiKey));
  const chain = [...new Set([primary, ...config.fallbackModels, ...(await freeFlashModels(config.apiKey, primary))])];
  const usable = chain.filter((model) => Date.now() >= (unavailableModels.get(`${config.apiKey}:${model}`) ?? 0));
  return usable.length > 0 ? usable : chain.slice(0, 1);
}

function markUnavailable(config: GeminiConfig, model: string, error: GeminiError): void {
  const pause = error.status === 429 ? QUOTA_PAUSE_MS : error.status === 404 ? MODEL_CACHE_MS : OVERLOAD_PAUSE_MS;
  unavailableModels.set(`${config.apiKey}:${model}`, Date.now() + pause);
}

function canUseSearch(config: GeminiConfig): boolean {
  return config.searchMode === "auto" && Date.now() >= (searchBlocks.get(config.apiKey) ?? 0);
}

async function generateWithModel(config: GeminiConfig, model: string, systemInstruction: string, prompt: string) {
  if (canUseSearch(config)) {
    try {
      return await generateWith(config, model, systemInstruction, prompt, true);
    } catch (error) {
      if (!(error instanceof GeminiError && error.status === 429)) throw error;
      searchBlocks.set(config.apiKey, Date.now() + SEARCH_BLOCK_MS);
    }
  }
  return generateWith(config, model, systemInstruction, prompt, false);
}

export async function generateWithSearch(systemInstruction: string, prompt: string): Promise<GeminiResult> {
  const config = await loadConfig();
  let lastError: unknown;

  for (const model of await candidateModels(config)) {
    try {
      return await generateWithModel(config, model, systemInstruction, prompt);
    } catch (error) {
      lastError = error;
      if (!(error instanceof GeminiError && error.canTryAnotherModel)) throw error;
      markUnavailable(config, model, error);
    }
  }

  if (lastError instanceof GeminiError && lastError.status === 429) {
    throw new GeminiError("Kuota harian semua model Gemini gratis sudah habis. Coba lagi besok atau pakai key berbayar.", 429);
  }
  throw lastError;
}

export interface InlineImage {
  data: string;
  mimeType: string;
}

export async function generateVision(systemInstruction: string, prompt: string, image: InlineImage): Promise<GeminiResult> {
  const config = await loadConfig();
  let lastError: unknown;

  for (const model of await candidateModels(config)) {
    try {
      const body = generateSchema.parse(
        await callApi(config.apiKey, `models/${model}:generateContent`, {
          method: "POST",
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [
              { role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] },
            ],
            generationConfig: { temperature: config.temperature },
          }),
        }),
      );
      const [candidate] = body.candidates;
      const text = candidate?.content?.parts.map((part) => part.text ?? "").join("") ?? "";
      if (!text.trim()) throw new GeminiError("Gemini tidak mengembalikan jawaban");
      return { text, model, sources: [], grounded: false };
    } catch (error) {
      lastError = error;
      if (!(error instanceof GeminiError && error.canTryAnotherModel)) throw error;
      markUnavailable(config, model, error);
    }
  }

  if (lastError instanceof GeminiError && lastError.status === 429) {
    throw new GeminiError("Kuota harian semua model Gemini gratis sudah habis. Coba lagi besok atau pakai key berbayar.", 429);
  }
  throw lastError;
}

async function generateWith(
  config: GeminiConfig,
  model: string,
  systemInstruction: string,
  prompt: string,
  useSearch: boolean,
): Promise<GeminiResult> {
  const body = generateSchema.parse(
    await callApi(config.apiKey, `models/${model}:generateContent`, {
      method: "POST",
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(useSearch && { tools: [{ google_search: {} }] }),
        generationConfig: { temperature: config.temperature },
      }),
    }),
  );

  const [candidate] = body.candidates;
  const text = candidate?.content?.parts.map((part) => part.text ?? "").join("") ?? "";
  if (!text.trim()) throw new GeminiError("Gemini tidak mengembalikan jawaban");

  const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .flatMap((chunk) => (chunk.web ? [{ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri }] : []))
    .filter((source, index, all) => all.findIndex((item) => item.uri === source.uri) === index);

  return { text, model, sources, grounded: useSearch };
}
