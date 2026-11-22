export type ProviderId = "gemini" | "openai" | "anthropic" | "xai" | "deepseek";
export type Adapter = "gemini" | "openai" | "anthropic";
export type Tier = "free" | "cheap" | "paid";

export const TIER_LABEL: Record<Tier, string> = {
  free: "Gratis",
  cheap: "Murah",
  paid: "Berbayar",
};

export interface ModelInfo {
  id: string;
  label: string;
  tier: Tier;
  vision: boolean;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  adapter: Adapter;
  baseUrl: string;
  keyUrl: string;
  keyField: ProviderKeyField;
  supportsSearch: boolean;
  models: ModelInfo[];
}

export type ProviderKeyField =
  | "geminiApiKey"
  | "openaiApiKey"
  | "anthropicApiKey"
  | "xaiApiKey"
  | "deepseekApiKey";

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    adapter: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyUrl: "https://aistudio.google.com/apikey",
    keyField: "geminiApiKey",
    supportsSearch: true,
    models: [
      { id: "", label: "Otomatis (Flash terbaru)", tier: "free", vision: true },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "free", vision: true },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "paid", vision: true },
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI (ChatGPT)",
    adapter: "openai",
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
    keyField: "openaiApiKey",
    supportsSearch: false,
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini", tier: "cheap", vision: true },
      { id: "gpt-4o", label: "GPT-4o", tier: "paid", vision: true },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    adapter: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyField: "anthropicApiKey",
    supportsSearch: false,
    models: [
      { id: "claude-3-5-haiku-latest", label: "Claude Haiku", tier: "cheap", vision: true },
      { id: "claude-3-5-sonnet-latest", label: "Claude Sonnet", tier: "paid", vision: true },
    ],
  },
  xai: {
    id: "xai",
    label: "xAI (Grok)",
    adapter: "openai",
    baseUrl: "https://api.x.ai/v1",
    keyUrl: "https://console.x.ai",
    keyField: "xaiApiKey",
    supportsSearch: false,
    models: [
      { id: "grok-2-vision-1212", label: "Grok 2 Vision", tier: "paid", vision: true },
      { id: "grok-2-1212", label: "Grok 2", tier: "paid", vision: false },
    ],
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    adapter: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyField: "deepseekApiKey",
    supportsSearch: false,
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat", tier: "cheap", vision: false },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner", tier: "cheap", vision: false },
    ],
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

export function getProvider(id: string): ProviderInfo {
  return PROVIDERS[id as ProviderId] ?? PROVIDERS.gemini;
}

export function defaultModel(provider: ProviderInfo): string {
  return provider.models[0]?.id ?? "";
}

export function modelSupportsVision(provider: ProviderInfo, modelId: string): boolean {
  const known = provider.models.find((model) => model.id === modelId);
  return known ? known.vision : provider.models.some((model) => model.vision);
}
