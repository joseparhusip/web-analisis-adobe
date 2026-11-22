import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { formatPercent } from "@/lib/format";
import { type RadarItem, trendRadar } from "@/lib/research/radar";
import { cn } from "@/lib/utils";

const CHIP_LIMIT = 6;

export async function RadarSection() {
  const { items, anyAvailable } = await trendRadar();
  if (items.length === 0) return null;

  const available = items.filter((item) => item.available);

  return (
    <Card>
      <CardHeader
        title="Radar tren"
        description="Pencarian yang sedang naik untuk tema yang lagi di jendela upload. Sumber: Google Trends (AS)."
      />
      <CardBody className="space-y-4">
        {!anyAvailable && (
          <Notice tone="warning" title="Google Trends sedang dibatasi">
            Data radar muncul begitu Google Trends bisa diakses lagi. Skor dan riset lain tetap jalan.
          </Notice>
        )}
        {available.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {available.map((item) => (
              <RadarCard key={item.event.id} item={item} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function RadarCard({ item }: { item: RadarItem }) {
  const up = item.yearOverYear !== null && item.yearOverYear >= 0;

  return (
    <article className="rounded-xl border p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate font-semibold">{item.event.name}</h3>
        {item.yearOverYear !== null && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              up ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
            )}
          >
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {formatPercent(item.yearOverYear)}
          </span>
        )}
      </header>
      {item.risingQueries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.risingQueries.slice(0, CHIP_LIMIT).map((query) => (
            <Link
              key={query}
              href={{ pathname: "/research", query: { q: query } }}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent-soft hover:text-accent"
            >
              {query}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada pencarian terkait yang menonjol.</p>
      )}
    </article>
  );
}
