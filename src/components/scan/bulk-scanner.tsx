"use client";

import { ExternalLink, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { type ScanResult, scanKeywordsAction } from "@/app/(main)/scan/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { buildAdobeSearchUrl } from "@/lib/adobe/search-url";
import { ASSET_TYPE_META } from "@/lib/asset-types";
import { MAX_BULK_KEYWORDS } from "@/lib/research/bulk-input";
import { opportunityLevel } from "@/lib/research/scoring";
import { cn } from "@/lib/utils";

const LEVEL_TONE = { high: "success", medium: "warning", low: "danger" } as const;

export function BulkScanner() {
  const [state, action, pending] = useActionState<ScanResult | null, FormData>(scanKeywordsAction, null);

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <form action={action} className="space-y-3">
            <textarea
              name="keywords"
              rows={5}
              required
              placeholder={"christmas background\nsnowman vector\nramadan lantern\nwinter cabin"}
              className="w-full resize-y rounded-lg border bg-card p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Satu keyword per baris atau pisah koma. Maksimal {MAX_BULK_KEYWORDS}. Permintaan dari data saran pencarian;
                persaingan muncul untuk keyword yang sudah punya data Adobe.
              </p>
              <Button type="submit" disabled={pending}>
                <ScanSearch className={pending ? "size-4 animate-pulse" : "size-4"} />
                {pending ? "Memindai…" : "Scan"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {pending && <p className="text-xs text-muted-foreground">Mengambil saran pencarian untuk tiap keyword, biasanya 5–20 detik.</p>}
      {state && !state.ok && <Notice tone="danger" title="Gagal memindai">{state.message}</Notice>}

      {state?.ok && (
        <Card>
          <CardBody className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-medium">Keyword</th>
                  <th className="py-2 pr-4 font-medium">Permintaan</th>
                  <th className="py-2 pr-4 font-medium">Peluang terbaik</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row) => (
                  <tr key={row.keyword} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link href={{ pathname: "/research", query: { q: row.keyword } }} className="font-medium hover:text-accent hover:underline">
                        {row.keyword}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${row.demand}%` }} />
                        </div>
                        <span className="tabular-nums text-muted-foreground">{row.demand}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {row.best ? (
                        <span className="flex items-center gap-2">
                          <Badge tone={LEVEL_TONE[opportunityLevel(row.best.opportunity)]}>
                            {ASSET_TYPE_META[row.best.assetType].label} {row.best.opportunity}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">butuh data Adobe</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <a
                        href={buildAdobeSearchUrl(row.keyword, row.best?.assetType ?? "photo")}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonClass({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
                        title="Cek jumlah aset di Adobe"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
