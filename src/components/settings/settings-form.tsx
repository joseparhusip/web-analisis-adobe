"use client";

import { Bot, ExternalLink, Image as ImageIcon, PlugZap, Save } from "lucide-react";
import { type ReactNode, useActionState, useRef, useState, useTransition } from "react";
import { type ConnectionResult, saveSettingsAction, type SettingsActionState, testAiAction } from "@/app/(main)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { PROMPT_COUNTS } from "@/lib/ai/prompt-options";
import { defaultModel, getProvider, PROVIDER_LIST, type ProviderId } from "@/lib/ai/providers";
import { cn } from "@/lib/utils";

export interface SettingsFormValues {
  aiProvider: ProviderId;
  aiModel: string;
  keyMasks: Record<string, string | undefined>;
  geminiKeySource: "settings" | "env" | "none";
  searchMode: string;
  creativity: string;
  defaultPromptCount: number;
  shutterstockClientId: string;
  shutterstockSecretMask?: string;
}

interface SettingsFormProps {
  values: SettingsFormValues;
  modelsByProvider: Record<string, { value: string; label: string }[]>;
  creativityModes: { value: string; label: string; description: string }[];
  searchModes: { value: string; label: string }[];
}

export function SettingsForm({ values, modelsByProvider, creativityModes, searchModes }: SettingsFormProps) {
  const [state, action, saving] = useActionState<SettingsActionState | null, FormData>(saveSettingsAction, null);
  const [provider, setProvider] = useState<ProviderId>(values.aiProvider);
  const [model, setModel] = useState(values.aiModel);
  const [searchMode, setSearchMode] = useState(values.searchMode);
  const [promptCount, setPromptCount] = useState(String(values.defaultPromptCount));
  const [connection, setConnection] = useState<ConnectionResult>();
  const [testing, startTest] = useTransition();
  const keyInput = useRef<HTMLInputElement>(null);

  const info = getProvider(provider);
  const keyMask = values.keyMasks[provider];
  const isStoredHere = provider === "gemini" ? values.geminiKeySource === "settings" : Boolean(keyMask);

  const onProviderChange = (id: string) => {
    const next = id as ProviderId;
    setProvider(next);
    setConnection(undefined);
    const nextProvider = getProvider(next);
    if (!nextProvider.models.some((item) => item.id === model)) setModel(defaultModel(nextProvider));
  };

  const testConnection = () =>
    startTest(async () => setConnection(await testAiAction(provider, keyInput.current?.value ?? "", model)));

  const modelOptions = modelsByProvider[provider] ?? [];

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="aiProvider" value={provider} />
      <input type="hidden" name="aiModel" value={model} />
      <input type="hidden" name="searchMode" value={searchMode} />
      <input type="hidden" name="defaultPromptCount" value={promptCount} />

      <Card>
        <CardHeader
          icon={<Bot className="size-4" />}
          title="Penyedia AI"
          description="Dipakai untuk analisis, prompt Google Flow, dan baca gambar."
          action={<Badge tone="accent">{info.label}</Badge>}
        />
        <CardBody className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Penyedia">
              <Dropdown
                ariaLabel="Penyedia AI"
                value={provider}
                onChange={onProviderChange}
                options={PROVIDER_LIST.map((item) => ({ value: item.id, label: item.label }))}
              />
            </Field>
            <Field label="Model" hint="Urut dari gratis/murah ke berbayar.">
              <Dropdown ariaLabel="Model" value={model} onChange={setModel} options={modelOptions} />
            </Field>
          </div>

          <Field
            label="API key"
            hint={
              <>
                Saat ini: {keyMask ?? "belum ada"}
                {provider === "gemini" && values.geminiKeySource === "env" ? " (dari .env.local)" : ""}. Kosongkan untuk tetap
                memakai key yang tersimpan.{" "}
                <a href={info.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                  Dapatkan API key {info.label}
                  <ExternalLink className="size-3" />
                </a>
              </>
            }
          >
            <div className="flex flex-wrap gap-2">
              <Input ref={keyInput} name="apiKey" type="password" autoComplete="off" placeholder={`Tempel API key ${info.label}`} className="flex-1" />
              <Button type="button" variant="secondary" onClick={testConnection} disabled={testing}>
                <PlugZap className="size-4" />
                {testing ? "Mengetes…" : "Tes koneksi"}
              </Button>
            </div>
            {connection && <p className={cn("mt-1.5 text-xs", connection.ok ? "text-success" : "text-danger")}>{connection.message}</p>}
            {isStoredHere && (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="clearApiKey" className="accent-accent" />
                Hapus key {info.label} yang tersimpan
              </label>
            )}
          </Field>

          <Field label="Mode jawaban">
            <RadioCards name="creativity" defaultValue={values.creativity} options={creativityModes} />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Google Search"
              hint={info.supportsSearch ? "Hanya untuk Gemini; key gratis biasanya tanpa kuota Search." : "Tidak tersedia di penyedia ini."}
            >
              <Dropdown
                ariaLabel="Google Search"
                value={searchMode}
                onChange={setSearchMode}
                options={searchModes.map((mode) => ({ value: mode.value, label: mode.label }))}
              />
            </Field>
            <Field label="Jumlah prompt default">
              <Dropdown
                ariaLabel="Jumlah prompt default"
                value={promptCount}
                onChange={setPromptCount}
                options={PROMPT_COUNTS.map((count) => ({ value: String(count), label: `${count} prompt` }))}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ImageIcon className="size-4" />}
          title="Shutterstock (opsional)"
          description="Pembanding jumlah aset saat data Adobe belum ada."
        />
        <CardBody className="grid gap-5 md:grid-cols-2">
          <Field label="Client ID">
            <Input name="shutterstockClientId" defaultValue={values.shutterstockClientId} autoComplete="off" />
          </Field>
          <Field label="Client secret" hint={`Saat ini: ${values.shutterstockSecretMask ?? "–"}. Kosongkan untuk tetap.`}>
            <Input name="shutterstockClientSecret" type="password" autoComplete="off" />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          <Save className="size-4" />
          {saving ? "Menyimpan…" : "Simpan pengaturan"}
        </Button>
        {state && <span className={cn("text-sm", state.ok ? "text-success" : "text-danger")}>{state.message}</span>}
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface RadioCardsProps {
  name: string;
  defaultValue: string;
  options: { value: string; label: string; description: string }[];
}

function RadioCards({ name, defaultValue, options }: RadioCardsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="cursor-pointer rounded-lg border p-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
        >
          <input type="radio" name={name} value={option.value} defaultChecked={defaultValue === option.value} className="sr-only" />
          <span className="block text-sm font-medium">{option.label}</span>
          <span className="block text-xs text-muted-foreground">{option.description}</span>
        </label>
      ))}
    </div>
  );
}
