import { ExternalLink, Flame } from "lucide-react";
import { getCompetition, getLongTail } from "@/app/(main)/research/data";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { type ExtensionStatus, getExtensionStatus } from "@/lib/adobe/extension-status";
import { buildAdobeSearchUrl } from "@/lib/adobe/search-url";
import { Notice } from "@/components/ui/notice";
import { ASSET_TYPE_META, ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import type { AdobeSample } from "@/lib/db/schema";
import { buildKeywordSet } from "@/lib/research/keyword-set";
import { extractTitlePatterns } from "@/lib/research/title-patterns";
import { MINUTE } from "@/lib/time";
import { adobeSignature } from "@/lib/adobe/signature";
import { AdobeDataWatcher } from "./adobe-data-watcher";

const THUMBNAIL_LIMIT = 12;
const CONNECTED_WINDOW_MS = 30 * MINUTE;

const SETUP_STEPS = [
  "Buka chrome://extensions di Chrome, nyalakan Developer mode (kanan atas).",
  "Klik Load unpacked, pilih folder extension di dalam project ini. Kalau sudah terpasang, klik tombol reload di kartu ekstensinya.",
  "Klik salah satu tombol di bawah. Halaman terlaris Adobe Stock terbuka, dan notifikasi ungu muncul di kanan bawah saat data tercatat.",
  "Kembali ke tab ini. Data muncul otomatis dalam beberapa detik.",
];

export async function BestSellerSection({ keyword }: { keyword: string }) {
  const [{ adobe }, longTail, extension] = await Promise.all([
    getCompetition(keyword),
    getLongTail(keyword),
    getExtensionStatus(),
  ]);

  const groups = ASSET_TYPES.flatMap((type) => {
    const entry = adobe.bestSellers[type];
    return entry ? [{ type, samples: entry.samples }] : [];
  });
  const missingTypes = ASSET_TYPES.filter((type) => !adobe.bestSellers[type]);
  const observedTimes = [...Object.values(adobe.totals), ...Object.values(adobe.bestSellers)].map((entry) =>
    entry.observedAt.getTime(),
  );

  const patterns = extractTitlePatterns(groups.flatMap((group) => group.samples.map((sample) => sample.title)), keyword);
  const keywordSet = buildKeywordSet(keyword, patterns, longTail.keywords);

  return (
    <Card>
      <AdobeDataWatcher
        keyword={keyword}
        signature={adobeSignature(observedTimes.length > 0 ? Math.max(...observedTimes) : null, extension.lastSeenAt)}
      />
      <CardHeader
        icon={<Flame className="size-4" />}
        title="Apa yang laku di Adobe Stock"
        description="Aset terlaris dari halaman Adobe Stock yang kamu buka dengan ekstensi Stock Research."
        action={<ExtensionBadge status={extension} />}
      />
      <CardBody className="space-y-6">
        {extension.problem && <ProblemNotice status={extension} />}

        {groups.length === 0 && (
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {SETUP_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}

        {missingTypes.length > 0 && <OpenButtons keyword={keyword} types={missingTypes} />}

        {patterns.length > 0 && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Pola judul yang sering dipakai aset terlaris</p>
              <CopyButton text={keywordSet.join(", ")} label={`Copy ${keywordSet.length} keyword`} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patterns.map((pattern) => (
                <span key={pattern.phrase} className="rounded-md bg-muted px-2 py-1 text-xs">
                  {pattern.phrase} <span className="text-muted-foreground tabular-nums">{Math.round(pattern.share * 100)}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {groups.map((group) => (
          <SampleGrid key={group.type} title={ASSET_TYPE_META[group.type].label} samples={group.samples} />
        ))}
      </CardBody>
    </Card>
  );
}

function ExtensionBadge({ status }: { status: ExtensionStatus }) {
  const lastSeen = status.lastSeenAt ? new Date(status.lastSeenAt).getTime() : 0;
  if (!lastSeen) return <Badge tone="warning">Ekstensi belum terhubung</Badge>;

  const isRecent = Date.now() - lastSeen < CONNECTED_WINDOW_MS;
  return <Badge tone={isRecent ? "success" : "neutral"}>{isRecent ? "Ekstensi terhubung" : "Ekstensi terpasang"}</Badge>;
}

function ProblemNotice({ status }: { status: ExtensionStatus }) {
  const { problem, lastCapturedAt } = status;
  if (!problem || (lastCapturedAt && lastCapturedAt > problem.reportedAt)) return null;

  return (
    <Notice
      tone="warning"
      title="Jumlah hasil Adobe belum terbaca"
      action={<CopyButton text={`${problem.url}\n${problem.detail}`} label="Copy laporan" />}
    >
      Ekstensi terbuka di Adobe Stock tapi datanya belum tercatat. Salin laporan ini dan kirim ke developer supaya pembacanya
      disesuaikan.
    </Notice>
  );
}

function OpenButtons({ keyword, types }: { keyword: string; types: readonly AssetType[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Buka terlaris:</span>
      {types.map((type) => (
        <a
          key={type}
          href={buildAdobeSearchUrl(keyword, type)}
          target="_blank"
          rel="noreferrer"
          className={buttonClass({ variant: "secondary", size: "sm" })}
        >
          <ExternalLink className="size-3.5" />
          {ASSET_TYPE_META[type].label}
        </a>
      ))}
    </div>
  );
}

function SampleGrid({ title, samples }: { title: string; samples: AdobeSample[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {title} terlaris · {samples.length} aset tercatat
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {samples.slice(0, THUMBNAIL_LIMIT).map((sample) => (
          <a
            key={sample.id}
            href={sample.pageUrl}
            target="_blank"
            rel="noreferrer"
            title={sample.title}
            className="group overflow-hidden rounded-lg border bg-muted"
          >
            {sample.thumbnailUrl ? (
              <img
                src={sample.thumbnailUrl}
                alt={sample.title}
                loading="lazy"
                className="aspect-square w-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <span className="flex aspect-square items-center p-2 text-[11px] text-muted-foreground">{sample.title}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
