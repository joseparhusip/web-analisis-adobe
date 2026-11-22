import { Activity } from "lucide-react";
import { getObservationHistory, type SaturationSeries } from "@/lib/adobe/observations";
import { ASSET_TYPE_META } from "@/lib/asset-types";
import { Badge, type Tone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { formatCompact, formatPercent } from "@/lib/format";
import { SaturationChart, SERIES_COLORS } from "./saturation-chart";

const RISING_THRESHOLD = 0.02;

function growth(series: SaturationSeries): { label: string; tone: Tone } {
  if (series.growthRatio >= RISING_THRESHOLD) {
    return { label: `makin padat ${formatPercent(series.growthRatio)} / ${series.spanDays} hari`, tone: "danger" };
  }
  if (series.growthRatio <= -RISING_THRESHOLD) {
    return { label: `menurun ${formatPercent(series.growthRatio)}`, tone: "success" };
  }
  return { label: "relatif stabil", tone: "neutral" };
}

export async function SaturationSection({ keyword }: { keyword: string }) {
  const series = await getObservationHistory(keyword);

  return (
    <Card>
      <CardHeader
        icon={<Activity className="size-4" />}
        title="Kejenuhan dari waktu ke waktu"
        description="Perubahan jumlah aset Adobe untuk keyword ini. Naik cepat = makin banyak kontributor masuk."
      />
      <CardBody className="space-y-4">
        {series.length === 0 ? (
          <Notice tone="info" title="Butuh pengecekan berulang">
            Data tersaji setelah keyword ini ditangkap ekstensi minimal dua hari berbeda. Buka “Cek di Adobe” lagi beberapa hari
            ke depan, lalu lihat tren kepadatannya di sini.
          </Notice>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {series.map((line) => {
                const change = growth(line);
                return (
                  <span key={line.assetType} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs">
                    <span className="size-2 rounded-full" style={{ background: SERIES_COLORS[line.assetType] }} aria-hidden />
                    {ASSET_TYPE_META[line.assetType].label}: {formatCompact(line.lastTotal)}
                    <Badge tone={change.tone}>{change.label}</Badge>
                  </span>
                );
              })}
            </div>
            <SaturationChart series={series} />
          </>
        )}
      </CardBody>
    </Card>
  );
}
