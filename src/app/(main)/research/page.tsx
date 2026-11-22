import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { BestSellerSection } from "@/components/research/best-seller-section";
import { CreativeSection } from "@/components/research/creative-section";
import { LongTailSection } from "@/components/research/long-tail-section";
import { SaveKeywordForm } from "@/components/research/save-keyword-form";
import { ScoreSection } from "@/components/research/score-section";
import { TrendSection } from "@/components/research/trend-section";
import { SearchForm } from "@/components/search-form";
import { Card, CardBody } from "@/components/ui/card";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { normalizeKeyword } from "@/lib/keyword";
import { findSavedKeyword } from "@/lib/keywords/repository";
import { NicheSection } from "@/components/research/niche-section";
import { SaturationSection } from "@/components/research/saturation-section";
import { type AssetType, isAssetType } from "@/lib/asset-types";

interface ResearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export const maxDuration = 60;

export async function generateMetadata({ searchParams }: ResearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Riset: ${normalizeKeyword(q)}` : "Riset Keyword" };
}

export default async function ResearchPage({ searchParams }: ResearchPageProps) {
  const { q, type } = await searchParams;
  const keyword = normalizeKeyword(q ?? "");

  if (!keyword) {
    return (
      <>
        <PageHeader
          title="Riset Keyword"
          description="Cek permintaan, persaingan, dan keyword turunan untuk foto, ilustrasi, vektor, dan video."
        />
        <Card>
          <CardBody>
            <SearchForm autoFocus />
          </CardBody>
        </Card>
      </>
    );
  }

  const saved = await findSavedKeyword(keyword);

  return (
    <>
      <SearchForm defaultValue={keyword} className="mb-6" />
      <PageHeader title={keyword} action={<SaveKeywordForm key={keyword} keyword={keyword} savedTags={saved?.tags} />} />

      <div className="space-y-6">
        <Suspense fallback={<SectionSkeleton title="Skor peluang per tipe aset" />}>
          <ScoreSection keyword={keyword} />
        </Suspense>
        <div id="prompt" className="scroll-mt-6">
          <Suspense fallback={<SectionSkeleton title="Prompt Google Flow" />}>
            <CreativeSection keyword={keyword} requestedType={isAssetType(type ?? "") ? (type as AssetType) : undefined} />
          </Suspense>
        </div>
        <Suspense fallback={<SectionSkeleton title="Tren minat 5 tahun" description="Mengambil data Google Trends…" />}>
          <TrendSection keyword={keyword} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Keyword turunan (long-tail)" />}>
          <LongTailSection keyword={keyword} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Apa yang laku di Adobe Stock" />}>
          <BestSellerSection keyword={keyword} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Kejenuhan dari waktu ke waktu" />}>
          <SaturationSection keyword={keyword} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Niche sepi pesaing" />}>
          <NicheSection keyword={keyword} />
        </Suspense>
      </div>
    </>
  );
}
