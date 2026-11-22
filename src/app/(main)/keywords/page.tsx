import type { Metadata } from "next";
import { KeywordTable } from "@/components/keywords/keyword-table";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { listSavedKeywords } from "@/lib/keywords/repository";

export const metadata: Metadata = { title: "Database Keyword" };
export const dynamic = "force-dynamic";

export default async function KeywordsPage() {
  const rows = await listSavedKeywords();

  return (
    <>
      <PageHeader
        title="Database Keyword"
        description="Keyword hasil riset beserta skor peluang per tipe aset. Klik tag untuk mengubah, centang untuk copy sebagian."
      />
      <Card>
        <CardBody>
          <KeywordTable
            rows={rows.map(({ id, keyword, tags, bestAssetType, bestScore, scores, scoredAt }) => ({
              id,
              keyword,
              tags,
              bestAssetType,
              bestScore,
              scores,
              scoredAt,
            }))}
          />
        </CardBody>
      </Card>
    </>
  );
}
