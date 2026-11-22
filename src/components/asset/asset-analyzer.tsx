"use client";

import { ImageUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { type ImageAnalysisResult, analyzeImageAction } from "@/app/(main)/asset/actions";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Notice } from "@/components/ui/notice";
import type { AssetAnalysis } from "@/lib/ai/asset-analysis";
import type { ReferenceAnalysis } from "@/lib/ai/reference-analysis";
import { ASSET_TYPE_META } from "@/lib/asset-types";
import { cn } from "@/lib/utils";

type Mode = "metadata" | "recreate";

const COUNT_OPTIONS = Array.from({ length: 10 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} prompt` }));

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "metadata", label: "Metadata asetku", hint: "Aset hasil rendermu → judul, kategori, keyword + cek aturan." },
  { value: "recreate", label: "Amati & modifikasi", hint: "Aset orang → dijelaskan + prompt untuk versi mirip tapi beda." },
];

export function AssetAnalyzer({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<ImageAnalysisResult | null, FormData>(analyzeImageAction, null);
  const [mode, setMode] = useState<Mode>("metadata");
  const [count, setCount] = useState("3");
  const [preview, setPreview] = useState<string>();
  const [fileName, setFileName] = useState<string>();

  const onPick = (file: File | undefined) => {
    setPreview((url) => {
      if (url) URL.revokeObjectURL(url);
      return file ? URL.createObjectURL(file) : undefined;
    });
    setFileName(file?.name);
  };

  const activeMode = MODES.find((item) => item.value === mode)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={pending}
            onClick={() => setMode(item.value)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition disabled:opacity-50",
              mode === item.value ? "border-accent bg-accent-soft font-medium text-accent" : "hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{activeMode.hint}</p>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form action={action} className="space-y-4">
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="count" value={count} />
          {mode === "recreate" && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Jumlah prompt variasi</p>
              <Dropdown ariaLabel="Jumlah prompt" value={count} onChange={setCount} options={COUNT_OPTIONS} />
            </div>
          )}
          <Card>
            <CardBody className="space-y-4">
              <label
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed text-center text-sm text-muted-foreground transition hover:bg-muted",
                  preview && "border-solid p-0",
                )}
              >
                {preview ? (
                  <img src={preview} alt="Pratinjau" className="size-full object-contain" />
                ) : (
                  <>
                    <ImageUp className="size-6" />
                    <span>Klik untuk pilih gambar</span>
                    <span className="text-xs">JPG, PNG, atau WEBP · maks 4 MB</span>
                  </>
                )}
                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="hidden"
                  onChange={(event) => onPick(event.target.files?.[0])}
                />
              </label>
              {fileName && <p className="truncate text-xs text-muted-foreground">{fileName}</p>}
              <Button type="submit" className="w-full" disabled={!configured || pending}>
                <Sparkles className={pending ? "size-4 animate-pulse" : "size-4"} />
                {pending ? "Menganalisis gambar…" : activeMode.label}
              </Button>
            </CardBody>
          </Card>

          {!configured && (
            <Notice
              tone="warning"
              title="API key Gemini belum diisi"
              action={
                <Link href="/settings" className="text-xs font-medium text-accent hover:underline">
                  Pengaturan
                </Link>
              }
            >
              Fitur ini membaca gambar pakai Gemini. Isi API key dulu.
            </Notice>
          )}
          {state && !state.ok && (
            <Notice tone="danger" title={/kuota|habis|limit|quota/i.test(state.message) ? "Token AI habis" : "Gagal"}>
              {state.message}
            </Notice>
          )}
        </form>

        <div>
          {state?.ok && state.mode === "metadata" ? (
            <MetadataResult analysis={state.analysis} model={state.model} />
          ) : state?.ok && state.mode === "recreate" ? (
            <RecreateResult reference={state.reference} model={state.model} />
          ) : (
            <Card className="grid h-full min-h-64 place-items-center">
              <p className="max-w-xs p-6 text-center text-sm text-muted-foreground">{activeMode.hint}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataResult({ analysis, model }: { analysis: AssetAnalysis; model: string }) {
  return (
    <div className="space-y-4">
      {analysis.ruleCheck.ok ? (
        <Notice tone="success" title="Lolos aturan Adobe Stock">
          Tidak ada manusia dikenali, merek, teks, atau logo yang terdeteksi.
        </Notice>
      ) : (
        <Notice tone="danger" title="Berpotensi ditolak Adobe">
          <ul className="list-disc space-y-0.5 pl-4">
            {analysis.ruleCheck.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </Notice>
      )}

      <Card>
        <CardBody className="space-y-4">
          <Field label="Deskripsi">{analysis.description}</Field>
          <Field label="Judul Adobe" action={<CopyButton text={analysis.adobeTitle} label="Copy" />}>
            {analysis.adobeTitle} <span className="text-xs text-muted-foreground">({analysis.adobeTitle.length} karakter)</span>
          </Field>
          <Field label="Kategori">
            <Badge tone="accent">{analysis.category}</Badge>
          </Field>
          <Field
            label={`Keyword (${analysis.keywords.length})`}
            action={<CopyButton text={analysis.keywords.join(", ")} label="Copy semua" />}
          >
            <KeywordTags keywords={analysis.keywords} />
          </Field>
          <ModelNote model={model} />
        </CardBody>
      </Card>
    </div>
  );
}

function RecreateResult({ reference, model }: { reference: ReferenceAnalysis; model: string }) {
  const allPrompts = reference.variants.map((variant, index) => `#${index + 1} ${variant.name}\n${variant.flowPrompt}`).join("\n\n");

  return (
    <div className="space-y-4">
      <Notice tone="info" title="Amati, tiru, modifikasi">
        {reference.note}
      </Notice>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{ASSET_TYPE_META[reference.assetType].label}</Badge>
            <span className="text-sm font-medium">{reference.subject}</span>
          </div>
          <Field label="Ini gambar apa">{reference.description}</Field>
          <Field label="Gaya & komposisi">{reference.style}</Field>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{reference.variants.length} prompt variasi</h3>
        {reference.variants.length > 1 && <CopyButton text={allPrompts} label="Copy semua" />}
      </div>

      <div className="grid gap-4">
        {reference.variants.map((variant, index) => (
          <Card key={`${variant.name}-${index}`}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium">
                  <span className="text-muted-foreground">#{index + 1}</span> {variant.name}
                </h4>
                <CopyButton text={variant.flowPrompt} label="Copy" />
              </div>
              <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed">{variant.flowPrompt}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <ModelNote model={model} />
    </div>
  );
}

function KeywordTags({ keywords }: { keywords: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((keyword) => (
        <span key={keyword} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {keyword}
        </span>
      ))}
    </div>
  );
}

function ModelNote({ model }: { model: string }) {
  return <p className="border-t pt-3 text-xs text-muted-foreground">Dibuat oleh {model}. Periksa ulang sebelum dipakai.</p>;
}

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {action}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
