import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CountdownBadge } from "@/components/calendar/countdown-badge";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { RadarSection } from "@/components/dashboard/radar-section";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/app-shell";
import { SearchForm } from "@/components/search-form";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { ASSET_TYPE_META, isAssetType } from "@/lib/asset-types";
import { CATEGORY_LABELS } from "@/lib/calendar/events";
import type { ScheduledEvent } from "@/lib/calendar/schedule";
import { upcomingEvents } from "@/lib/calendar/schedule";
import { formatShortDate } from "@/lib/format";
import { listSavedKeywords } from "@/lib/keywords/repository";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TOP_KEYWORD_LIMIT = 6;
const UPLOAD_NOW_LIMIT = 6;

export default async function DashboardPage() {
  const now = new Date();
  const events = upcomingEvents(now);
  const uploadNow = events.filter((item) => item.status === "upload-now");
  const prepare = events.filter((item) => item.status === "prepare");
  const tooLate = events.filter((item) => item.status === "too-late");
  const topKeywords = (await listSavedKeywords()).slice(0, TOP_KEYWORD_LIMIT);

  return (
    <>
      <PageHeader title="Dashboard" description="Tema yang tepat untuk dikerjakan sekarang, berdasarkan waktu belanja pembeli." />

      <Card className="mb-6">
        <CardBody>
          <SearchForm autoFocus />
        </CardBody>
      </Card>

      <section className="mb-8">
        <MonthCalendar nowMs={now.getTime()} year={now.getUTCFullYear()} month={now.getUTCMonth()} />
      </section>

      <div className="mb-6">
        <Suspense fallback={<SectionSkeleton title="Radar tren" description="Mengambil data Google Trends…" />}>
          <RadarSection />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Waktunya upload sekarang"
            description="Event dalam jendela upload 12 bulan ke depan."
            action={
              <Link href="/calendar" className="text-xs font-medium text-accent hover:underline">
                Lihat kalender
              </Link>
            }
          />
          <CardBody className="space-y-1.5">
            {uploadNow.length > 0 ? (
              uploadNow.slice(0, UPLOAD_NOW_LIMIT).map((item) => <EventRow key={item.event.id} item={item} />)
            ) : (
              <EmptyState>Tidak ada event di jendela upload. Fokus ke tema evergreen.</EmptyState>
            )}
            {prepare.length > 0 && <TagLine label="Siapkan konsep" tone="accent" events={prepare} />}
            {tooLate.length > 0 && <TagLine label="Mepet" tone="warning" events={tooLate} />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Keyword tersimpan"
            description="Yang sudah dinilai tampil paling atas. Simpan dari tombol Simpan di halaman riset."
            action={
              <Link href="/keywords" className="text-xs font-medium text-accent hover:underline">
                Kelola
              </Link>
            }
          />
          <CardBody className="space-y-1.5">
            {topKeywords.length > 0 ? (
              topKeywords.map((item) => (
                <Link
                  key={item.id}
                  href={{ pathname: "/research", query: { q: item.keyword } }}
                  className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-muted"
                >
                  {item.bestScore !== null ? (
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold tabular-nums",
                        item.bestScore >= 55 ? "bg-success-soft text-success" : item.bestScore >= 35 ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.bestScore}
                    </span>
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">–</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.keyword}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.bestScore !== null && item.bestAssetType && isAssetType(item.bestAssetType)
                        ? `Terbaik di ${ASSET_TYPE_META[item.bestAssetType].label}`
                        : "Belum dinilai"}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))
            ) : (
              <EmptyState>
                Belum ada. Buka{" "}
                <Link href="/research" className="font-medium text-accent hover:underline">
                  Riset Keyword
                </Link>
                , cari tema, lalu klik Simpan di kanan atas.
              </EmptyState>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function EventRow({ item }: { item: ScheduledEvent }) {
  return (
    <Link
      href={{ pathname: "/research", query: { q: item.event.keywords[0] ?? item.event.name } }}
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-muted"
    >
      <CountdownBadge days={item.daysUntil} status={item.status} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.event.name}</span>
        <span className="block text-xs text-muted-foreground">
          {CATEGORY_LABELS[item.event.category]} · {item.approximate && "± "}
          {formatShortDate(item.date)}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

function TagLine({ label, tone, events }: { label: string; tone: "accent" | "warning"; events: ScheduledEvent[] }) {
  const chip = tone === "accent" ? "bg-accent-soft text-accent" : "bg-warning-soft text-warning";
  return (
    <div className="pt-2">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {events.map((item) => (
          <Link
            key={item.event.id}
            href={{ pathname: "/research", query: { q: item.event.keywords[0] ?? item.event.name } }}
            className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80", chip)}
          >
            {item.event.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
