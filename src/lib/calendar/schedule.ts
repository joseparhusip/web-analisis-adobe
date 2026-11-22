import { addDays, daysBetween, parseIsoDate, startOfUtcDay } from "@/lib/time";
import { clamp } from "@/lib/utils";
import { type DateRule, THEME_EVENTS, type ThemeEvent } from "./events";

export type UploadStatus = "upload-now" | "prepare" | "too-late" | "later" | "past";

export interface ScheduledEvent {
  event: ThemeEvent;
  date: Date;
  approximate: boolean;
  uploadStart: Date;
  uploadDeadline: Date;
  daysUntil: number;
  status: UploadStatus;
}

export const DEFAULT_LEAD_DAYS = 90;
export const DEADLINE_DAYS_BEFORE = 30;
const PREPARE_DAYS_BEFORE_START = 30;
const HORIZON_DAYS = 365;

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  if (nth < 0) {
    const last = new Date(Date.UTC(year, month, 0));
    const offset = (last.getUTCDay() - weekday + 7) % 7;
    return addDays(last, -offset + (nth + 1) * 7);
  }
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return addDays(first, offset + (nth - 1) * 7);
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function resolveDate(rule: DateRule, year: number): Date | undefined {
  switch (rule.kind) {
    case "fixed":
      return new Date(Date.UTC(year, rule.month - 1, rule.day));
    case "nthWeekday":
      return addDays(nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.nth), rule.offsetDays ?? 0);
    case "easter":
      return addDays(easterSunday(year), rule.offsetDays ?? 0);
    case "table": {
      const iso = rule.dates[year];
      return iso ? parseIsoDate(iso) : undefined;
    }
  }
}

function statusFor(daysUntil: number, leadDays: number): UploadStatus {
  if (daysUntil < 0) return "past";
  if (daysUntil <= DEADLINE_DAYS_BEFORE) return "too-late";
  if (daysUntil <= leadDays) return "upload-now";
  if (daysUntil <= leadDays + PREPARE_DAYS_BEFORE_START) return "prepare";
  return "later";
}

export function scheduleEvent(event: ThemeEvent, date: Date, today: Date): ScheduledEvent {
  const leadDays = event.leadDays ?? DEFAULT_LEAD_DAYS;
  const daysUntil = daysBetween(today, date);
  return {
    event,
    date,
    approximate: event.rule.kind === "table",
    uploadStart: addDays(date, -leadDays),
    uploadDeadline: addDays(date, -DEADLINE_DAYS_BEFORE),
    daysUntil,
    status: statusFor(daysUntil, leadDays),
  };
}

export function upcomingEvents(now = new Date(), horizonDays = HORIZON_DAYS): ScheduledEvent[] {
  const today = startOfUtcDay(now);
  const year = today.getUTCFullYear();

  return THEME_EVENTS.flatMap((event) =>
    [year, year + 1]
      .map((candidateYear) => resolveDate(event.rule, candidateYear))
      .filter((date): date is Date => date !== undefined)
      .map((date) => scheduleEvent(event, date, today))
      .filter((item) => item.daysUntil >= 0 && item.daysUntil <= horizonDays),
  ).sort((a, b) => a.daysUntil - b.daysUntil);
}

export function monthEvents(year: number, month: number, now = new Date()): ScheduledEvent[] {
  const today = startOfUtcDay(now);
  return THEME_EVENTS.flatMap((event) => {
    const date = resolveDate(event.rule, year);
    return date && date.getUTCMonth() === month ? [scheduleEvent(event, date, today)] : [];
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function eventsByStatus(status: UploadStatus, now = new Date()): ScheduledEvent[] {
  return upcomingEvents(now).filter((item) => item.status === status);
}

export function uploadPlan(year: number, month: number, now = new Date()): ScheduledEvent[] {
  const monthStart = Date.UTC(year, month, 1);
  const monthEnd = Date.UTC(year, month + 1, 0);
  const today = startOfUtcDay(now);
  const byEvent = new Map<string, ScheduledEvent>();

  for (const event of THEME_EVENTS) {
    for (const candidateYear of [year - 1, year, year + 1]) {
      const date = resolveDate(event.rule, candidateYear);
      if (!date) continue;
      const scheduled = scheduleEvent(event, date, today);
      const overlaps = scheduled.uploadStart.getTime() <= monthEnd && scheduled.uploadDeadline.getTime() >= monthStart;
      if (overlaps && !byEvent.has(event.id)) byEvent.set(event.id, scheduled);
    }
  }

  return [...byEvent.values()].sort((a, b) => a.uploadDeadline.getTime() - b.uploadDeadline.getTime());
}

export interface RunwayGeometry {
  windowPct: number;
  todayPct: number;
  beforeWindow: boolean;
  afterDeadline: boolean;
}

export function uploadRunway(item: ScheduledEvent, now = new Date()): RunwayGeometry {
  const start = item.uploadStart.getTime();
  const span = Math.max(item.date.getTime() - start, 1);
  const today = startOfUtcDay(now).getTime();
  const toPct = (value: number) => clamp(((value - start) / span) * 100, 0, 100);

  return {
    windowPct: toPct(item.uploadDeadline.getTime()),
    todayPct: toPct(today),
    beforeWindow: today < start,
    afterDeadline: today > item.uploadDeadline.getTime(),
  };
}
