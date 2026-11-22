import { ExternalLink } from "lucide-react";
import { getScores } from "@/app/(main)/research/data";
import { Badge, type Tone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { buildAdobeSearchUrl } from "@/lib/adobe/search-url";
import { ASSET_TYPE_META } from "@/lib/asset-types";
import { formatCompact, formatRelativeDays } from "@/lib/format";
import { type AssetScore, bestScore, type OpportunityLevel, opportunityLevel } from "@/lib/research/scoring";
import { daysBetween } from "@/lib/time";
import { ManualCountForm } from "./manual-count-form";

const LEVEL_META: Record<OpportunityLevel, { label: string; tone: Tone }> = {
  high: { label: "Peluang bagus", tone: "success" },
  medium: { label: "Sedang", tone: "warning" },
  low: { label: "Padat", tone: "danger" },
};

const SOURCE_LABELS = { adobe: "Adobe Stock", shutterstock: "Shutterstock" } as const;

export async function ScoreSection({ keyword }: { keyword: string }) {
  const scores = await getScores(keyword);
  const best = bestScore(scores);

  return (
    <Card>
      <CardHeader
        title="Skor peluang per tipe aset"
        description="Peluang = permintaan dibanding jumlah aset yang sudah ada. Skor relatif, gunakan untuk membandingkan."
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
  const level = score.opportunity === null ? undefined : LEVEL_META[opportunityLevel(score.opportunity)];
  const entry = score.competitionEntry;

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{meta.label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{score.opportunity ?? "–"}</p>
        </div>
        {level && <Badge tone={level.tone}>{level.label}</Badge>}
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
