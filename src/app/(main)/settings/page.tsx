import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { type GeminiModelOption, listGeminiModels } from "@/lib/ai/gemini";
import { CREATIVITY_MODES, getSettings, maskSecret, SEARCH_MODES } from "@/lib/settings/settings";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

async function availableModels(apiKey: string | undefined): Promise<GeminiModelOption[]> {
  if (!apiKey) return [];
  return listGeminiModels(apiKey).catch((error: unknown) => {
    console.error(error);
    return [];
  });
}

export default async function SettingsPage() {
  const settings = await getSettings();
  const models = await availableModels(settings.geminiApiKey);

  return (
    <>
      <PageHeader title="Pengaturan" description="Atur AI dan sumber data tanpa perlu membuka file .env." />
      <SettingsForm
        values={{
          geminiKeyMask: maskSecret(settings.geminiApiKey),
          geminiKeySource: settings.geminiApiKeySource,
          geminiModel: settings.geminiModel ?? "",
          geminiFallbackModel: settings.geminiFallbackModels[0] ?? "",
          searchMode: settings.searchMode,
          creativity: settings.creativity,
          defaultPromptCount: settings.defaultPromptCount,
          shutterstockClientId: settings.shutterstockClientId ?? "",
          shutterstockSecretMask: maskSecret(settings.shutterstockClientSecret),
        }}
        models={models}
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
