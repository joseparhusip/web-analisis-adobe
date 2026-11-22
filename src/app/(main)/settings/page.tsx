import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { listProviderModels } from "@/lib/ai/generate";
import { PROVIDER_LIST, TIER_LABEL } from "@/lib/ai/providers";
import { type AppSettings, CREATIVITY_MODES, getSettings, maskSecret, SEARCH_MODES } from "@/lib/settings/settings";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export interface ModelOption {
  value: string;
  label: string;
}

async function buildModelOptions(settings: AppSettings): Promise<Record<string, ModelOption[]>> {
  const entries = await Promise.all(
    PROVIDER_LIST.map(async (provider) => {
      const key = settings.apiKeys[provider.keyField];
      const live = key ? await listProviderModels(provider.id, key).catch(() => []) : [];
      const seen = new Set(provider.models.map((model) => model.id));
      const merged = [...provider.models, ...live.filter((model) => !seen.has(model.id))];
      const options = merged.map((model, index) => ({
        value: model.id,
        label: `${model.label} · ${TIER_LABEL[model.tier]}${model.vision ? " · bisa gambar" : ""}${index === 0 ? " · disarankan" : ""}`,
      }));
      return [provider.id, options] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export default async function SettingsPage() {
  const settings = await getSettings();
  const [keyMasks, modelsByProvider] = await Promise.all([
    Promise.resolve(Object.fromEntries(PROVIDER_LIST.map((p) => [p.id, maskSecret(settings.apiKeys[p.keyField])]))),
    buildModelOptions(settings),
  ]);

  return (
    <>
      <PageHeader title="Pengaturan" description="Pilih penyedia AI dan sumber data. Semua diatur dari sini, tanpa file .env." />
      <SettingsForm
        values={{
          aiProvider: settings.aiProvider,
          aiModel: settings.aiModel,
          keyMasks,
          geminiKeySource: settings.geminiApiKeySource,
          searchMode: settings.searchMode,
          creativity: settings.creativity,
          defaultPromptCount: settings.defaultPromptCount,
          shutterstockClientId: settings.shutterstockClientId ?? "",
          shutterstockSecretMask: maskSecret(settings.shutterstockClientSecret),
        }}
        modelsByProvider={modelsByProvider}
        creativityModes={Object.entries(CREATIVITY_MODES).map(([value, mode]) => ({
          value,
          label: mode.label,
          description: mode.description,
        }))}
        searchModes={Object.entries(SEARCH_MODES).map(([value, label]) => ({ value, label }))}
      />
    </>
  );
}
