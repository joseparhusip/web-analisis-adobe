import Link from "next/link";
import { Suspense } from "react";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { RadarSection } from "@/components/dashboard/radar-section";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG } from "@/components/calendar/status";
import { PageHeader } from "@/components/layout/app-shell";
import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { ASSET_TYPE_META, isAssetType } from "@/lib/asset-types";
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
          <CardBody className="space-y-1">
            {uploadNow.length > 0 ? (
              uploadNow.slice(0, UPLOAD_NOW_LIMIT).map((item) => <EventRow key={item.event.id} item={item} />)
            ) : (
              <EmptyState>Tidak ada event di jendela upload. Fokus ke tema evergreen.</EmptyState>
            )}
            {prepare.length > 0 && (
              <p className="pt-2 text-xs text-muted-foreground">
                Siapkan konsep: {prepare.map((item) => item.event.name).join(", ")}.
              </p>
            )}
            {tooLate.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Mepet: {tooLate.map((item) => item.event.name).join(", ")}. Aset baru kemungkinan tayang setelah puncak pembelian.
              </p>
            )}
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
          <CardBody className="space-y-1">
            {topKeywords.length > 0 ? (
              topKeywords.map((item) => (
                <Link
                  key={item.id}
                  href={{ pathname: "/research", query: { q: item.keyword } }}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  <span className="truncate">{item.keyword}</span>
                  {item.bestScore !== null ? (
                    <span className="flex items-center gap-2">
                      {item.bestAssetType && isAssetType(item.bestAssetType) && (
                        <Badge>{ASSET_TYPE_META[item.bestAssetType].label}</Badge>
                      )}
                      <span className="w-8 text-right font-medium tabular-nums">{item.bestScore}</span>
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">belum dinilai</span>
                  )}
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
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
    >
      <span className={cn("size-2 shrink-0 rounded-full", STATUS_CONFIG[item.status].dot)} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.event.name}</span>
        <span className="block text-xs text-muted-foreground">
          {item.approximate && "± "}
          {formatShortDate(item.date)}
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{item.daysUntil} hari</span>
    </Link>
  );
}
