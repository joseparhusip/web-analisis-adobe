"use client";

import { ExternalLink, Radar, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { generateNichesAction } from "@/app/(main)/research/actions";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import type { NicheLevel } from "@/lib/ai/niche-finder";
import type { NicheEntry, NicheReport } from "@/lib/ai/niche-service";
import { buildAdobeSearchUrl } from "@/lib/adobe/search-url";
import { ASSET_TYPE_META } from "@/lib/asset-types";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEMAND_META: Record<NicheLevel, { label: string; tone: Tone }> = {
  high: { label: "Permintaan tinggi", tone: "success" },
  medium: { label: "Permintaan sedang", tone: "accent" },
  low: { label: "Permintaan rendah", tone: "neutral" },
};

const COMPETITION_META: Record<NicheLevel, { label: string; tone: Tone }> = {
  low: { label: "Pesaing sedikit", tone: "success" },
  medium: { label: "Pesaing sedang", tone: "warning" },
  high: { label: "Pesaing banyak", tone: "danger" },
};

const ALL_THEMES = "";

interface NichePanelProps {
  keyword: string;
  configured: boolean;
  focusOptions: string[];
  initial?: NicheReport;
}

export function NichePanel({ keyword, configured, focusOptions, initial }: NichePanelProps) {
  const [focus, setFocus] = useState(initial?.focus ?? ALL_THEMES);
  const [report, setReport] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const analyze = (nextFocus: string) => {
    setFocus(nextFocus);
    startTransition(async () => {
      setError(undefined);
      const result = await generateNichesAction(keyword, nextFocus || undefined);
      if (result.ok) setReport(result.report);
      else setError(result.message);
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Klik fokus untuk dianalisis</p>
        <div className="flex flex-wrap gap-2">
          {[ALL_THEMES, ...focusOptions].map((option) => (
            <button
              key={option || "all"}
              type="button"
              disabled={!configured || pending}
              onClick={() => analyze(option)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-50",
                focus === option ? "border-accent bg-accent-soft font-medium text-accent" : "hover:bg-muted",
              )}
            >
              {option || "Semua tema"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => analyze(focus)} disabled={!configured || pending}>
          <Radar className={pending ? "size-4 animate-pulse" : "size-4"} />
          {pending ? "Menganalisis niche…" : report ? "Analisis ulang" : "Cari niche sepi pesaing"}
        </Button>
        {pending && <span className="text-xs text-muted-foreground">Biasanya 20–60 detik.</span>}
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
          Analisis niche butuh Gemini. Isi API key dulu di Pengaturan.
        </Notice>
      )}
      {error && (
        <Notice tone="danger" title={/kuota|habis|limit|quota/i.test(error) ? "Token AI habis" : "Gagal menganalisis"}>
          {error}
        </Notice>
      )}

      {report && (
        <>
          <p className="rounded-xl bg-muted p-4 text-sm">{report.summary}</p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {report.niches.map((niche, index) => (
              <NicheCard key={`${niche.keyword}-${niche.assetType}`} rank={index + 1} niche={niche} />
            ))}
          </ul>
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Fokus: {report.focus || "semua tema"} · model {report.model} · dibuat{" "}
            {new Date(report.generatedAt).toLocaleString("id-ID")}. Label “perkiraan AI” belum diukur; klik “Cek di Adobe” untuk
            mencatat jumlah aset aslinya, lalu muat ulang halaman.
          </p>
        </>
      )}
    </div>
  );
}

function CompetitionBadge({ niche }: { niche: NicheEntry }) {
  if (niche.measured) {
    const meta = COMPETITION_META[niche.measured.level];
    return (
      <Badge tone={meta.tone}>
        {meta.label} · {formatCompact(niche.measured.total)} aset (terukur)
      </Badge>
    );
  }
  const meta = COMPETITION_META[niche.competition];
  return <Badge tone={meta.tone}>{meta.label} · perkiraan AI</Badge>;
}

function NicheCard({ rank, niche }: { rank: number; niche: NicheEntry }) {
  const demand = DEMAND_META[niche.demand];

  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">
          <span className="text-muted-foreground">#{rank}</span> {niche.keyword}
        </h3>
        <Badge tone="accent">{ASSET_TYPE_META[niche.assetType].label}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={demand.tone}>{demand.label}</Badge>
        <CompetitionBadge niche={niche} />
      </div>
      <p className="text-xs text-muted-foreground">{niche.reason}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={{ pathname: "/research", query: { q: niche.keyword, type: niche.assetType }, hash: "prompt" }}
          className={buttonClass({ size: "sm" })}
        >
          <Sparkles className="size-3.5" />
          Buat prompt
        </Link>
        <a
          href={buildAdobeSearchUrl(niche.keyword, niche.assetType)}
          target="_blank"
          rel="noreferrer"
          className={buttonClass({ variant: "secondary", size: "sm" })}
        >
          <ExternalLink className="size-3.5" />
          Cek di Adobe
        </a>
      </div>
    </li>
  );
}
