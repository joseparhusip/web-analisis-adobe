import type { Metadata } from "next";
import { AssetAnalyzer } from "@/components/asset/asset-analyzer";
import { PageHeader } from "@/components/layout/app-shell";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export const metadata: Metadata = { title: "Analisis Aset" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function AssetPage() {
  return (
    <>
      <PageHeader
        title="Analisis Aset"
        description="Dua mode: susun metadata aset hasil rendermu, atau amati aset orang lalu bikin prompt versi modifikasi."
      />
      <AssetAnalyzer configured={await isGeminiConfigured()} />
    </>
  );
}
