import { ExternalLink, Film, Gauge, Image as ImageIcon, Palette, PenTool } from "lucide-react";
import type { ComponentType } from "react";
import { getScores } from "@/app/(main)/research/data";
import { Badge, type Tone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { buildAdobeSearchUrl } from "@/lib/adobe/search-url";
import { ASSET_TYPE_META, type AssetType } from "@/lib/asset-types";
import { formatCompact, formatRelativeDays } from "@/lib/format";
import { type AssetScore, bestScore, type OpportunityLevel, opportunityLevel } from "@/lib/research/scoring";
import { daysBetween } from "@/lib/time";
import { ManualCountForm } from "./manual-count-form";

const LEVEL_META: Record<OpportunityLevel, { label: string; tone: Tone }> = {
  high: { label: "Peluang bagus", tone: "success" },
  medium: { label: "Sedang", tone: "warning" },
  low: { label: "Padat", tone: "danger" },
};

const TYPE_ICON: Record<AssetType, ComponentType<{ className?: string }>> = {
  photo: ImageIcon,
  illustration: Palette,
  vector: PenTool,
  video: Film,
};

const SOURCE_LABELS = { adobe: "Adobe Stock", shutterstock: "Shutterstock" } as const;

export async function ScoreSection({ keyword }: { keyword: string }) {
  const scores = await getScores(keyword);
  const best = bestScore(scores);

  return (
    <Card>
      <CardHeader
        icon={<Gauge className="size-4" />}
        title="Skor peluang per tipe aset"
        description="Peluang = permintaan dibanding jumlah aset yang sudah ada. Skor relatif, untuk membandingkan."
        action={
          best && (
            <Badge tone="success" className="text-xs">
              Rekomendasi: {ASSET_TYPE_META[best.assetType].label} ({best.opportunity})
            </Badge>
          )
        }
      />
      <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {scores.map((score) => (
          <ScoreCard key={score.assetType} keyword={keyword} score={score} />
        ))}
      </CardBody>
    </Card>
  );
}

function ScoreCard({ keyword, score }: { keyword: string; score: AssetScore }) {
  const meta = ASSET_TYPE_META[score.assetType];
  const Icon = TYPE_ICON[score.assetType];
  const hasOpportunity = score.opportunity !== null;
  const level = hasOpportunity ? LEVEL_META[opportunityLevel(score.opportunity!)] : undefined;
  const entry = score.competitionEntry;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4 transition hover:shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-muted">
          <Icon className="size-4" />
        </span>
        <p className="font-medium">{meta.label}</p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {hasOpportunity ? "Peluang" : "Permintaan"}
          </p>
          <p className="text-4xl font-bold leading-none tabular-nums">{hasOpportunity ? score.opportunity : score.demand}</p>
        </div>
        {level ? (
          <Badge tone={level.tone}>{level.label}</Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">isi data Adobe</span>
        )}
      </div>

      <div className="space-y-2.5">
        <Meter label="Permintaan" value={score.demand} />
        <Meter label="Persaingan" value={score.competition} inverse />
      </div>

      <p className="text-xs text-muted-foreground">
        {entry
          ? `${formatCompact(entry.total)} aset · ${SOURCE_LABELS[entry.source]} · ${formatRelativeDays(daysBetween(new Date(), entry.observedAt))}`
          : "Belum ada data jumlah aset."}
      </p>

      <div className="mt-auto space-y-2 border-t pt-3">
        <a
          href={buildAdobeSearchUrl(keyword, score.assetType)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Buka terlaris di Adobe Stock
        </a>
        <ManualCountForm keyword={keyword} assetType={score.assetType} />
      </div>
    </div>
  );
}
