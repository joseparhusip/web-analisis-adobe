import { Sparkles } from "lucide-react";
import { getCompetition, getLongTail, getScores, getTrends } from "@/app/(main)/research/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getStoredBriefs } from "@/lib/ai/brief-service";
import { isAiConfigured } from "@/lib/ai/generate";
import { buildResearchContext } from "@/lib/ai/research-context";
import type { AssetType } from "@/lib/asset-types";
import { type AssetScore, bestScore } from "@/lib/research/scoring";
import { getSettings } from "@/lib/settings/settings";
import { extractTitlePatterns } from "@/lib/research/title-patterns";
import { CreativeBriefPanel } from "./creative-brief-panel";

function preferredType(scores: readonly AssetScore[]): AssetType {
  const byDemand = [...scores].sort((a, b) => b.demand - a.demand)[0];
  return bestScore(scores)?.assetType ?? byDemand?.assetType ?? "photo";
}

interface CreativeSectionProps {
  keyword: string;
  requestedType?: AssetType;
}

export async function CreativeSection({ keyword, requestedType }: CreativeSectionProps) {
  const [longTail, trends, competition, scores, briefs, configured, settings] = await Promise.all([
    getLongTail(keyword),
    getTrends(keyword),
    getCompetition(keyword),
    getScores(keyword),
    getStoredBriefs(keyword),
    isAiConfigured(),
    getSettings(),
  ]);

  const titles = Object.values(competition.adobe.bestSellers).flatMap((entry) => entry.samples.map((sample) => sample.title));
  const context = buildResearchContext(
    keyword,
    { longTail, trends, competition, scores },
    extractTitlePatterns(titles, keyword),
  );

  return (
    <Card>
      <CardHeader
        icon={<Sparkles className="size-4" />}
        title="Prompt Google Flow"
        description="Pilih jenis aset dan jumlah prompt, lalu Gemini menyusun analisis dan konsep: background minimalis, tanpa manusia, tanpa HAKI."
      />
      <CardBody>
        <CreativeBriefPanel
          key={`${keyword}:${requestedType ?? ""}`}
          keyword={keyword}
          configured={configured}
          initialBriefs={briefs}
          defaultType={requestedType ?? preferredType(scores)}
          defaultCount={settings.defaultPromptCount}
          context={context}
        />
      </CardBody>
    </Card>
  );
}
