import { activeKey, CREATIVITY_MODES, getSettings } from "@/lib/settings/settings";
import * as gemini from "./gemini";
import { GeminiError, type GeminiResult, type InlineImage, listGeminiModels } from "./gemini";
import { defaultModel, getProvider, modelSupportsVision, type ProviderInfo } from "./providers";

const REQUEST_TIMEOUT_MS = 90_000;
const MAX_TOKENS = 4096;

export async function isAiConfigured(): Promise<boolean> {
  return Boolean(activeKey(await getSettings()));
}

interface ResolvedConfig {
  provider: ProviderInfo;
  key: string;
  model: string;
  temperature: number;
}

async function resolve(): Promise<ResolvedConfig> {
  const settings = await getSettings();
  const provider = getProvider(settings.aiProvider);
  const key = activeKey(settings);
  if (!key) throw new GeminiError(`API key ${provider.label} belum diisi. Buka menu Pengaturan.`);
  return {
    provider,
    key,
    model: settings.aiModel.trim() || defaultModel(provider),
    temperature: CREATIVITY_MODES[settings.creativity].temperature,
  };
}

export async function generateText(systemInstruction: string, prompt: string): Promise<GeminiResult> {
  const settings = await getSettings();
  if (settings.aiProvider === "gemini") return gemini.generateWithSearch(systemInstruction, prompt);

  const config = await resolve();
  return config.provider.adapter === "anthropic"
    ? callAnthropic(config, systemInstruction, prompt)
    : callOpenAI(config, systemInstruction, prompt);
}

export async function generateVision(systemInstruction: string, prompt: string, image: InlineImage): Promise<GeminiResult> {
  const settings = await getSettings();
  if (settings.aiProvider === "gemini") return gemini.generateVision(systemInstruction, prompt, image);

  const config = await resolve();
  if (!modelSupportsVision(config.provider, config.model)) {
    throw new GeminiError(
      `${config.provider.label} (${config.model}) tidak bisa membaca gambar. Untuk fitur gambar, pilih Gemini, OpenAI, Claude, atau Grok Vision di Pengaturan.`,
    );
  }
  return config.provider.adapter === "anthropic"
    ? callAnthropic(config, systemInstruction, prompt, image)
    : callOpenAI(config, systemInstruction, prompt, image);
}

export async function testConnection(providerId: string, key: string, model: string): Promise<{ ok: boolean; message: string }> {
  const provider = getProvider(providerId);
  const config: ResolvedConfig = { provider, key, model: model.trim() || defaultModel(provider), temperature: 0 };

  try {
    if (provider.adapter === "gemini") {
      const models = await listGeminiModels(key);
      return { ok: true, message: `Terhubung. ${models.length} model Gemini tersedia.` };
    }
    const result =
      provider.adapter === "anthropic"
        ? await callAnthropic(config, "You are a connection test.", "Reply with the word OK.")
        : await callOpenAI(config, "You are a connection test.", "Reply with the word OK.");
    return { ok: true, message: `Terhubung ke ${provider.label} (${result.model}).` };
  } catch (error) {
    return { ok: false, message: error instanceof GeminiError ? error.message : `Tidak bisa menghubungi ${provider.label}` };
  }
}

function providerError(body: unknown, status: number, label: string): GeminiError {
  const message = (body as { error?: { message?: string } } | null)?.error?.message;
  if (status === 401 || status === 403) return new GeminiError(`API key ${label} tidak valid atau tanpa akses.`, status);
  if (status === 429) return new GeminiError(`Kuota ${label} habis atau kena limit. Coba lagi nanti.`, status);
  return new GeminiError(message ?? `${label} error ${status}`, status);
}

async function callOpenAI(config: ResolvedConfig, system: string, prompt: string, image?: InlineImage): Promise<GeminiResult> {
  const content = image
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } },
      ]
    : prompt;

  const response = await fetch(`${config.provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.key}` },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
      temperature: config.temperature,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw providerError(body, response.status, config.provider.label);

  const text = (body as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new GeminiError(`${config.provider.label} tidak mengembalikan jawaban`);
  return { text, model: config.model, sources: [], grounded: false };
}

async function callAnthropic(config: ResolvedConfig, system: string, prompt: string, image?: InlineImage): Promise<GeminiResult> {
  const content = image
    ? [
        { type: "text", text: prompt },
        { type: "image", source: { type: "base64", media_type: image.mimeType, data: image.data } },
      ]
    : [{ type: "text", text: prompt }];

  const response = await fetch(`${config.provider.baseUrl}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": config.key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: config.model,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content }],
      temperature: config.temperature,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw providerError(body, response.status, config.provider.label);

  const text = ((body as { content?: { type: string; text?: string }[] }).content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
  if (!text.trim()) throw new GeminiError(`${config.provider.label} tidak mengembalikan jawaban`);
  return { text, model: config.model, sources: [], grounded: false };
}
