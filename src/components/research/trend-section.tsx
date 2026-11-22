import Link from "next/link";
import type { ReactNode } from "react";
import { getTrends } from "@/app/(main)/research/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { MONTH_NAMES, formatPercent } from "@/lib/format";
import type { TrendInsight } from "@/lib/research/trend-analysis";
import { describeTrend, type FindingTone } from "@/lib/research/trend-narrative";
import { cn } from "@/lib/utils";
import { TRENDS_GEO } from "@/lib/sources/google-trends";
import { InterestTimeline, MonthlyProfile } from "./trend-charts";

const RELATED_LIMIT = 10;

function googleTrendsUrl(keyword: string): string {
  return `https://trends.google.com/trends/explore?date=today%205-y&geo=${TRENDS_GEO}&q=${encodeURIComponent(keyword)}`;
}

function timeFormatter(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export async function TrendSection({ keyword }: { keyword: string }) {
  const trends = await getTrends(keyword);
  const trendsLink = (
    <a href={googleTrendsUrl(keyword)} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:underline">
      Buka Google Trends
    </a>
  );

  if (trends.status === "unavailable") {
    return (
      <Card>
        <CardHeader title="Tren minat 5 tahun" action={trendsLink} />
        <CardBody>
          <Notice tone="warning" title={trends.retryAt ? "Google Trends sedang membatasi akses" : "Data Google Trends tidak tersedia"}>
            {trends.retryAt
              ? `Terlalu banyak permintaan ke Google. Muat ulang halaman setelah ${timeFormatter(trends.retryAt)}.`
              : "Keyword ini tidak punya data tren yang cukup di Google Trends."}{" "}
            Skor peluang tetap dihitung dari data saran pencarian, jadi hasil riset tetap bisa dipakai.
          </Notice>
        </CardBody>
      </Card>
    );
  }

  const { data, insight } = trends;
  const related = [...new Set([...data.risingQueries, ...data.topQueries])].slice(0, RELATED_LIMIT);

  return (
    <Card>
      <CardHeader title="Tren minat 5 tahun" description="Sumber: Google Trends, Amerika Serikat." action={trendsLink} />
      <CardBody className="space-y-6">
        <TrendStats insight={insight} />
        <TrendFindings insight={insight} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartBlock title="Minat mingguan">
            <InterestTimeline timeline={data.timeline} />
          </ChartBlock>
          <ChartBlock title="Pola per bulan (puncak disorot)">
            <MonthlyProfile profile={insight.monthlyProfile} peakMonths={insight.peakMonths} />
          </ChartBlock>
        </div>
        {related.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Pencarian terkait yang sedang naik</p>
            <div className="flex flex-wrap gap-1.5">
              {related.map((query) => (
                <Link
                  key={query}
                  href={{ pathname: "/research", query: { q: query } }}
                  className="rounded-md border px-2 py-1 text-xs transition hover:border-accent hover:text-accent"
                >
                  {query}
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

const FINDING_DOTS: Record<FindingTone, string> = {
  good: "bg-success",
  warn: "bg-warning",
  info: "bg-accent",
};

function TrendFindings({ insight }: { insight: TrendInsight }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Analisis tren</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {describeTrend(insight, new Date()).map((finding) => (
          <li key={finding.title} className="flex gap-2.5 rounded-lg border p-3 text-sm">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", FINDING_DOTS[finding.tone])} />
            <span>
              <span className="font-medium">{finding.title}.</span> {finding.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function TrendStats({ insight }: { insight: TrendInsight }) {
  const peakLabel = insight.peakMonths.map((month) => MONTH_NAMES[month]).join(", ");
  const timing =
    insight.monthsUntilPeak === null
      ? "Dicari sepanjang tahun"
      : insight.monthsUntilPeak === 0
        ? "Sedang di puncak"
        : `Puncak ${insight.monthsUntilPeak} bulan lagi`;

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Pola">
        <Badge tone={insight.isEvergreen ? "accent" : "warning"}>{insight.isEvergreen ? "Evergreen" : "Musiman"}</Badge>
      </Stat>
      <Stat label="Bulan puncak">{peakLabel || "–"}</Stat>
      <Stat label="Waktu">{timing}</Stat>
      <Stat label="Tren tahunan">
        {insight.yearOverYear === null ? (
          "–"
        ) : (
          <span className={insight.yearOverYear >= 0 ? "text-success" : "text-danger"}>{formatPercent(insight.yearOverYear)}</span>
        )}
      </Stat>
    </dl>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  );
}
