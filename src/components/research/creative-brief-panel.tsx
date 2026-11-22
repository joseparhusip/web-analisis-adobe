"use client";

import { ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { generateBriefAction } from "@/app/(main)/research/actions";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { StoredBrief, StoredBriefs } from "@/lib/ai/brief-service";
import { buildChatGptPrompt, type CreativeBrief } from "@/lib/ai/creative-brief";
import { PROMPT_COUNTS } from "@/lib/ai/prompt-options";
import { ASSET_TYPE_META, ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { cn } from "@/lib/utils";

const GOOGLE_FLOW_URL = "https://labs.google/fx/tools/flow";
const SOURCE_LIMIT = 5;

function aiErrorTitle(message: string): string {
  return /kuota|habis|limit|quota/i.test(message) ? "Token AI habis" : "Gagal membuat prompt";
}

interface CreativeBriefPanelProps {
  keyword: string;
  configured: boolean;
  initialBriefs: StoredBriefs;
  defaultType: AssetType;
  defaultCount: number;
  context: string;
}

export function CreativeBriefPanel({
  keyword,
  configured,
  initialBriefs,
  defaultType,
  defaultCount,
  context,
}: CreativeBriefPanelProps) {
  const [assetType, setAssetType] = useState<AssetType>(defaultType);
  const [count, setCount] = useState(defaultCount);
  const [briefs, setBriefs] = useState(initialBriefs);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const stored = briefs[assetType];
  const label = ASSET_TYPE_META[assetType].label;

  const generate = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await generateBriefAction(keyword, assetType, count);
      if (result.ok) setBriefs((current) => ({ ...current, [assetType]: result.stored }));
      else setError(result.message);
    });

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">1. Pilih jenis aset</p>
        <OptionGroup
          options={ASSET_TYPES.map((type) => ({
            value: type,
            label: `${ASSET_TYPE_META[type].label}${briefs[type] ? " ✓" : ""}`,
          }))}
          value={assetType}
          onChange={setAssetType}
          disabled={pending}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">2. Pilih jumlah prompt</p>
        <OptionGroup
          options={PROMPT_COUNTS.map((value) => ({ value, label: String(value) }))}
          value={count}
          onChange={setCount}
          disabled={pending}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">3. Generate</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={generate} disabled={!configured || pending}>
            <Sparkles className={pending ? "size-4 animate-pulse" : "size-4"} />
            {pending ? `Menyusun ${count} prompt ${label}…` : `Generate ${count} prompt ${label}`}
          </Button>
          <CopyButton text={buildChatGptPrompt(context, assetType, count)} label="Copy prompt untuk ChatGPT" />
          <a
            href={GOOGLE_FLOW_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Buka Google Flow
          </a>
        </div>
      </div>

      {!configured && (
        <Notice
          tone="warning"
          title="API key Gemini belum diisi"
          action={
            <Link href="/settings" className="text-xs font-medium text-accent hover:underline">
              Buka Pengaturan
            </Link>
          }
        >
          Tanpa key, prompt tidak bisa dibuat otomatis. Kamu masih bisa pakai tombol “Copy prompt untuk ChatGPT”.
        </Notice>
      )}
      {pending && <p className="text-xs text-muted-foreground">Gemini sedang menganalisis dan menyusun konsep, biasanya 20–60 detik.</p>}
      {error && (
        <Notice tone="danger" title={aiErrorTitle(error)}>
          {error}
        </Notice>
      )}

      {stored && <BriefResult keyword={keyword} stored={stored} />}
    </div>
  );
}

interface OptionGroupProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function OptionGroup<T extends string | number>({ options, value, onChange, disabled }: OptionGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-w-12 rounded-lg border px-4 py-2 text-sm transition disabled:opacity-50",
            value === option.value ? "border-accent bg-accent-soft font-medium text-accent" : "hover:bg-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BriefResult({ keyword, stored }: { keyword: string; stored: StoredBrief }) {
  return (
    <>
      <AnalysisView keyword={keyword} brief={stored.brief} />
      <div className="grid gap-4 lg:grid-cols-2">
        {stored.brief.concepts.map((concept, index) => (
          <ConceptCard key={`${concept.name}-${index}`} rank={index + 1} concept={concept} />
        ))}
      </div>
      <footer className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
        <p>
          Model: {stored.model} · {stored.grounded ? "dengan Google Search" : "tanpa Google Search"} · dibuat{" "}
          {new Date(stored.generatedAt).toLocaleString("id-ID")}
        </p>
        {stored.sources.length > 0 && (
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            Sumber:
            {stored.sources.slice(0, SOURCE_LIMIT).map((source) => (
              <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
                {source.title}
              </a>
            ))}
          </p>
        )}
      </footer>
    </>
  );
}

function AnalysisView({ keyword, brief }: { keyword: string; brief: CreativeBrief }) {
  const { analysis, englishKeyword } = brief;
  const suggestEnglish = englishKeyword.toLowerCase() !== keyword.toLowerCase();

  return (
    <div className="space-y-3 rounded-xl bg-muted p-4 text-sm">
      {suggestEnglish && (
        <Link
          href={{ pathname: "/research", query: { q: englishKeyword } }}
          className="text-xs font-medium text-accent hover:underline"
        >
          Riset versi Inggris: “{englishKeyword}”
        </Link>
      )}
      <p>{analysis.summary}</p>
      <dl className="grid gap-3 md:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Yang dicari pembeli</dt>
          <dd className="mt-0.5">{analysis.buyerIntent}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Waktu</dt>
          <dd className="mt-0.5">{analysis.timing}</dd>
        </div>
      </dl>
      {analysis.tips.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {analysis.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConceptCard({ rank, concept }: { rank: number; concept: CreativeBrief["concepts"][number] }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border p-4">
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-medium">
          <span className="text-muted-foreground">#{rank}</span> {concept.name}
        </h3>
        <Badge tone="accent">{ASSET_TYPE_META[concept.assetType].label}</Badge>
      </header>
      <p className="text-xs text-muted-foreground">{concept.reason}</p>

      <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed">{concept.flowPrompt}</div>

      <dl className="space-y-1 text-xs">
        <div>
          <dt className="inline font-medium">Judul: </dt>
          <dd className="inline">{concept.adobeTitle}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Keyword: </dt>
          <dd className="inline text-muted-foreground">{concept.keywords.join(", ")}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2">
        <CopyButton text={concept.flowPrompt} label="Copy prompt Flow" />
        <CopyButton text={concept.adobeTitle} label="Copy judul" />
        <CopyButton text={concept.keywords.join(", ")} label="Copy keyword" />
      </div>
    </article>
  );
}
