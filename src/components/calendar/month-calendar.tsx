"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type EventCategory } from "@/lib/calendar/events";
import { monthEvents, type ScheduledEvent, uploadPlan } from "@/lib/calendar/schedule";
import { Dropdown } from "@/components/ui/dropdown";
import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import { startOfUtcDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import { EventDialog } from "./event-dialog";
import { countdownLabel, LEGEND_STATUSES, STATUS_CONFIG } from "./status";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const ALL = "all";

interface MonthCalendarProps {
  nowMs: number;
  year: number;
  month: number;
}

interface DayCell {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  events: ScheduledEvent[];
}

const monthLabel = (year: number, month: number) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));

function buildCells(year: number, month: number, events: readonly ScheduledEvent[], today: Date): DayCell[] {
  const byDay = new Map<number, ScheduledEvent[]>();
  for (const item of events) byDay.set(item.date.getUTCDate(), [...(byDay.get(item.date.getUTCDate()) ?? []), item]);

  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const isCurrentMonth = today.getUTCFullYear() === year && today.getUTCMonth() === month;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    const inMonth = day >= 1 && day <= daysInMonth;
    return {
      key: `${year}-${month}-${index}`,
      day,
      inMonth,
      isToday: isCurrentMonth && inMonth && day === today.getUTCDate(),
      events: inMonth ? (byDay.get(day) ?? []) : [],
    };
  });
}

export function MonthCalendar({ nowMs, year, month }: MonthCalendarProps) {
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const today = useMemo(() => startOfUtcDay(now), [now]);
  const [cursor, setCursor] = useState({ year, month });
  const [category, setCategory] = useState<EventCategory | typeof ALL>(ALL);
  const [selected, setSelected] = useState<ScheduledEvent | null>(null);

  const events = useMemo(() => {
    const all = monthEvents(cursor.year, cursor.month, now);
    return category === ALL ? all : all.filter((item) => item.event.category === category);
  }, [cursor, category, now]);

  const cells = useMemo(() => buildCells(cursor.year, cursor.month, events, today), [cursor, events, today]);
  const plan = useMemo(() => uploadPlan(cursor.year, cursor.month, now), [cursor, now]);

  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const d = new Date(Date.UTC(c.year, c.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  const shiftYear = (delta: number) => setCursor((c) => ({ ...c, year: c.year + delta }));
  const goToday = () => setCursor({ year: today.getUTCFullYear(), month: today.getUTCMonth() });

  const isCurrentView = cursor.year === today.getUTCFullYear() && cursor.month === today.getUTCMonth();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <NavButton label="Tahun lalu" onClick={() => shiftYear(-1)}>
            <ChevronsLeft className="size-4" />
          </NavButton>
          <NavButton label="Bulan lalu" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="size-4" />
          </NavButton>
          <h2 className="min-w-40 text-center text-sm font-semibold capitalize">{monthLabel(cursor.year, cursor.month)}</h2>
          <NavButton label="Bulan depan" onClick={() => shiftMonth(1)}>
            <ChevronRight className="size-4" />
          </NavButton>
          <NavButton label="Tahun depan" onClick={() => shiftYear(1)}>
            <ChevronsRight className="size-4" />
          </NavButton>
          <button
            type="button"
            onClick={goToday}
            disabled={isCurrentView}
            className="ml-1 rounded-lg border px-3 py-1.5 text-xs transition hover:bg-muted disabled:opacity-40"
          >
            Hari ini
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            {LEGEND_STATUSES.map((status) => (
              <span key={status} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", STATUS_CONFIG[status].dot)} aria-hidden />
                {STATUS_CONFIG[status].label}
              </span>
            ))}
          </div>
          <Dropdown
            ariaLabel="Filter kategori"
            className="w-44"
            value={category}
            onChange={(value) => setCategory(value as EventCategory | typeof ALL)}
            options={[
              { value: ALL, label: "Semua kategori" },
              ...(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((key) => ({ value: key, label: CATEGORY_LABELS[key] })),
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => (
            <div
              key={cell.key}
              className={cn(
                "min-h-24 space-y-1 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                !cell.inMonth && "bg-muted/30",
              )}
            >
              {cell.inMonth && (
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      cell.isToday ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    {cell.day}
                  </span>
                </div>
              )}
              {cell.events.map((item) => (
                <button
                  key={item.event.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  title={item.event.name}
                  className={cn(
                    "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium transition hover:opacity-80",
                    STATUS_CONFIG[item.status].chip,
                  )}
                >
                  {item.approximate && "± "}
                  {item.event.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <WorkPlan monthLabel={monthLabel(cursor.year, cursor.month)} plan={plan} onOpen={setSelected} />

      {selected && <EventDialog item={selected} now={now} onClose={() => setSelected(null)} />}
    </div>
  );
}

function WorkPlan({
  monthLabel,
  plan,
  onOpen,
}: {
  monthLabel: string;
  plan: ScheduledEvent[];
  onOpen: (item: ScheduledEvent) => void;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h3 className="text-sm font-semibold capitalize">Rencana upload · {monthLabel}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Tema yang jendela upload-nya terbuka di bulan ini, urut dari batas terdekat.</p>

      {plan.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Tidak ada tema dalam jendela upload bulan ini.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {plan.map((item) => (
            <li key={item.event.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className={cn("size-2 shrink-0 rounded-full", STATUS_CONFIG[item.status].dot)} aria-hidden />
              <button type="button" onClick={() => onOpen(item)} className="text-sm font-medium hover:text-accent">
                {item.event.name}
              </button>
              <span className="text-xs text-muted-foreground">
                batas {formatShortDate(item.uploadDeadline)} · {countdownLabel(item.daysUntil)}
              </span>
              <span className="ml-auto flex gap-3 text-xs">
                <Link href={{ pathname: "/research", query: { q: item.event.keywords[0] } }} className="font-medium text-accent hover:underline">
                  Riset
                </Link>
                <Link
                  href={{ pathname: "/research", query: { q: item.event.keywords[0] }, hash: "prompt" }}
                  className="font-medium text-accent hover:underline"
                >
                  Prompt
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg border p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
