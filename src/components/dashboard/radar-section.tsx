import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { formatPercent } from "@/lib/format";
import { type RadarItem, trendRadar } from "@/lib/research/radar";

export async function RadarSection() {
  const { items, anyAvailable } = await trendRadar();

  if (items.length === 0) return null;

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
        {items.filter((item) => item.available).map((item) => (
          <RadarRow key={item.event.id} item={item} />
        ))}
      </CardBody>
    </Card>
  );
}

function RadarRow({ item }: { item: RadarItem }) {
  return (
    <div className="border-b pb-3 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center gap-2">
        <TrendingUp className="size-4 text-accent" />
        <span className="font-medium">{item.event.name}</span>
        {item.yearOverYear !== null && (
          <Badge tone={item.yearOverYear >= 0 ? "success" : "warning"}>{formatPercent(item.yearOverYear)} YoY</Badge>
        )}
      </div>
      {item.risingQueries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.risingQueries.map((query) => (
            <Link
              key={query}
              href={{ pathname: "/research", query: { q: query } }}
              className="rounded-md border px-2 py-0.5 text-xs transition hover:border-accent hover:text-accent"
            >
              {query}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada pencarian terkait yang menonjol.</p>
      )}
    </div>
  );
}
