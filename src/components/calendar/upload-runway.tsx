import { type ScheduledEvent, uploadRunway } from "@/lib/calendar/schedule";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UploadRunway({ item, now }: { item: ScheduledEvent; now?: Date }) {
  const geo = uploadRunway(item, now);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Jendela upload</span>
        <span className={cn("font-medium", geo.afterDeadline ? "text-warning" : "text-foreground")}>
          batas {formatShortDate(item.uploadDeadline)}
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-muted" title="Hijau: jendela ideal. Oranye: zona mepet.">
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-success" style={{ width: `${geo.windowPct}%` }} aria-hidden />
        <div className="absolute inset-y-0 right-0 rounded-r-full bg-warning" style={{ left: `${geo.windowPct}%` }} aria-hidden />
        <span
          title="Hari ini"
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground shadow"
          style={{ left: `${geo.todayPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Mulai {formatShortDate(item.uploadStart)}</span>
        <span>Hari-H {formatShortDate(item.date)}</span>
      </div>
    </div>
  );
}
