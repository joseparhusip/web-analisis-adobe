import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/calendar/events";
import type { ScheduledEvent, UploadStatus } from "@/lib/calendar/schedule";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./status";
import { UploadRunway } from "./upload-runway";

const KEYWORD_LIMIT = 4;

export function StatusBadge({ status }: { status: UploadStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function EventCard({ item }: { item: ScheduledEvent }) {
  const { event } = item;
  const status = STATUS_CONFIG[item.status];
  const visibleKeywords = event.keywords.slice(0, KEYWORD_LIMIT);
  const extraKeywords = event.keywords.length - visibleKeywords.length;

  return (
    <article className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-4 pl-5 transition hover:shadow-sm">
      <span className={cn("absolute inset-y-0 left-0 w-1", status.rail)} aria-hidden />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", status.dot)} aria-hidden />
            <h3 className="truncate font-semibold">{event.name}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="uppercase tracking-wide">{CATEGORY_LABELS[event.category]}</span> ·{" "}
            {item.approximate && "± "}
            {formatLongDate(item.date)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold leading-none tabular-nums">{item.daysUntil}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">hari lagi</div>
        </div>
      </header>

      <UploadRunway item={item} />

      <div className="flex flex-wrap items-center gap-1.5">
        {visibleKeywords.map((keyword) => (
          <Link
            key={keyword}
            href={{ pathname: "/research", query: { q: keyword } }}
            className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground transition hover:text-accent"
          >
            {keyword}
          </Link>
        ))}
        {extraKeywords > 0 && <span className="text-[11px] text-muted-foreground">+{extraKeywords}</span>}
      </div>
    </article>
  );
}
