import { Radar } from "lucide-react";
import { getCompetition } from "@/app/(main)/research/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { isAiConfigured } from "@/lib/ai/generate";
import { getNicheReport } from "@/lib/ai/niche-service";
import { extractTitlePatterns } from "@/lib/research/title-patterns";
import { NichePanel } from "./niche-panel";

const FOCUS_LIMIT = 12;

export async function NicheSection({ keyword }: { keyword: string }) {
  const [{ adobe }, configured, report] = await Promise.all([
    getCompetition(keyword),
    isAiConfigured(),
    getNicheReport(keyword),
  ]);

  const titles = Object.values(adobe.bestSellers).flatMap((entry) => entry.samples.map((sample) => sample.title));
  const focusOptions = extractTitlePatterns(titles, keyword)
    .slice(0, FOCUS_LIMIT)
    .map((pattern) => pattern.phrase);

  return (
    <Card>
      <CardHeader
        icon={<Radar className="size-4" />}
        title="Niche sepi pesaing"
        description="Gemini membandingkan aset terlaris, tren, dan pencarian nyata untuk menemukan sub-tema yang dicari pembeli tapi masih sedikit pesaingnya."
      />
      <CardBody>
        <NichePanel key={keyword} keyword={keyword} configured={configured} focusOptions={focusOptions} initial={report} />
      </CardBody>
    </Card>
  );
}
