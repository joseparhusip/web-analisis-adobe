import { getLongTail } from "@/app/(main)/research/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LongTailTable } from "./long-tail-table";

export async function LongTailSection({ keyword }: { keyword: string }) {
  const { keywords, totalCandidates } = await getLongTail(keyword);

  return (
    <Card>
      <CardHeader
        title="Keyword turunan terbaik"
        description={`${keywords.length} frasa terkuat dari ${totalCandidates} pencarian nyata di Google dan YouTube (AS), sudah dibersihkan dari duplikat dan noise.`}
      />
      <CardBody>
        <LongTailTable keywords={keywords} />
      </CardBody>
    </Card>
  );
}
