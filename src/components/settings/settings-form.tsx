"use client";

import { PlugZap, Save } from "lucide-react";
import { type ReactNode, useActionState, useRef, useState, useTransition } from "react";
import { type ConnectionResult, saveSettingsAction, type SettingsActionState, testGeminiAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROMPT_COUNTS } from "@/lib/ai/prompt-options";
import { cn } from "@/lib/utils";

export interface SettingsFormValues {
  geminiKeyMask?: string;
  geminiKeySource: "settings" | "env" | "none";
  geminiModel: string;
  geminiFallbackModel: string;
  searchMode: string;
  creativity: string;
  defaultPromptCount: number;
  shutterstockClientId: string;
  shutterstockSecretMask?: string;
}

interface SettingsFormProps {
  values: SettingsFormValues;
  models: { id: string; displayName: string }[];
  creativityModes: { value: string; label: string; description: string }[];
  searchModes: { value: string; label: string }[];
}

const KEY_SOURCE_LABELS = {
  settings: "tersimpan dari halaman ini",
  env: "dari file .env.local",
  none: "belum ada",
} as const;

export function SettingsForm({ values, models, creativityModes, searchModes }: SettingsFormProps) {
  const [state, action, saving] = useActionState<SettingsActionState | null, FormData>(saveSettingsAction, null);
  const [connection, setConnection] = useState<ConnectionResult>();
  const [testing, startTest] = useTransition();
  const keyInput = useRef<HTMLInputElement>(null);

  const modelOptions = withCurrent(models, [values.geminiModel, values.geminiFallbackModel]);
  const testConnection = () => startTest(async () => setConnection(await testGeminiAction(keyInput.current?.value ?? "")));

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader title="AI (Gemini)" description="Dipakai untuk analisis dan pembuatan prompt Google Flow." />
        <CardBody className="space-y-5">
          <Field
            label="API key"
            hint={
              <>
                Saat ini: {values.geminiKeyMask ?? "–"} ({KEY_SOURCE_LABELS[values.geminiKeySource]}). Kosongkan untuk tetap memakai
                key yang sekarang. Key gratis bisa dibuat di aistudio.google.com.
              </>
            }
          >
            <div className="flex flex-wrap gap-2">
              <Input ref={keyInput} name="geminiApiKey" type="password" autoComplete="off" placeholder="Tempel API key baru" className="flex-1" />
              <Button type="button" variant="secondary" onClick={testConnection} disabled={testing}>
                <PlugZap className="size-4" />
                {testing ? "Mengetes…" : "Tes koneksi"}
              </Button>
            </div>
            {connection && <p className={cn("mt-1.5 text-xs", connection.ok ? "text-success" : "text-danger")}>{connection.message}</p>}
            {values.geminiKeySource === "settings" && (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="clearGeminiApiKey" className="accent-accent" />
                Hapus key yang tersimpan di sini (kembali ke .env.local)
              </label>
            )}
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Model utama" hint="Otomatis memilih Gemini Flash terbaru di akunmu.">
              <Select name="geminiModel" defaultValue={values.geminiModel}>
                <option value="">Otomatis (Flash terbaru)</option>
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName} ({model.id})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Model cadangan" hint="Dipakai saat model utama sibuk atau kena batas kuota.">
              <Select name="geminiFallbackModel" defaultValue={values.geminiFallbackModel}>
                <option value="">Tidak ada</option>
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName} ({model.id})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Mode jawaban">
            <RadioCards name="creativity" defaultValue={values.creativity} options={creativityModes} />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Google Search" hint="Key gratis biasanya tidak punya kuota Google Search; otomatis dilewati.">
              <Select name="searchMode" defaultValue={values.searchMode}>
                {searchModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Jumlah prompt default">
              <Select name="defaultPromptCount" defaultValue={String(values.defaultPromptCount)}>
                {PROMPT_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count} prompt
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Shutterstock (opsional)" description="Pembanding jumlah aset saat data Adobe belum ada." />
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

function withCurrent(models: SettingsFormProps["models"], current: string[]) {
  const missing = current.filter((id) => id && !models.some((model) => model.id === id));
  return [...missing.map((id) => ({ id, displayName: id })), ...models];
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
