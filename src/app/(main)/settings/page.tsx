import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { PROVIDER_LIST } from "@/lib/ai/providers";
import { CREATIVITY_MODES, getSettings, maskSecret, SEARCH_MODES } from "@/lib/settings/settings";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const keyMasks = Object.fromEntries(
    PROVIDER_LIST.map((provider) => [provider.id, maskSecret(settings.apiKeys[provider.keyField])]),
  );

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
