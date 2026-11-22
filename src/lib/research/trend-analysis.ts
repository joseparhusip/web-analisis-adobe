import type { TrendPoint } from "@/lib/sources/google-trends";
import { addDays, parseIsoDate } from "@/lib/time";
import { average } from "@/lib/utils";

export interface TrendInsight {
  monthlyProfile: number[];
  peakMonths: number[];
  seasonality: number;
  isEvergreen: boolean;
  recentAverage: number;
  yearOverYear: number | null;
  uploadWindowFit: number;
  monthsUntilPeak: number | null;
}

const WEEKS_PER_YEAR = 52;
const PEAK_THRESHOLD = 80;
const EVERGREEN_SEASONALITY = 0.35;
const EVERGREEN_PEAK_MONTHS = 6;
const UPLOAD_WINDOW_DAYS = [30, 60, 90];

function buildMonthlyProfile(timeline: readonly TrendPoint[]): number[] {
  const buckets = Array.from({ length: 12 }, (): number[] => []);
  for (const point of timeline) buckets[parseIsoDate(point.date).getUTCMonth()]!.push(point.value);

  const raw = buckets.map(average);
  const max = Math.max(...raw, 1);
  return raw.map((value) => Math.round((value / max) * 100));
}

function computeYearOverYear(timeline: readonly TrendPoint[]): number | null {
  if (timeline.length < WEEKS_PER_YEAR * 2) return null;
  const values = timeline.map((point) => point.value);
  const current = average(values.slice(-WEEKS_PER_YEAR));
  const previous = average(values.slice(-WEEKS_PER_YEAR * 2, -WEEKS_PER_YEAR));
  return previous === 0 ? null : (current - previous) / previous;
}

function monthsUntil(fromMonth: number, targets: readonly number[]): number | null {
  if (targets.length === 0) return null;
  return Math.min(...targets.map((month) => (month - fromMonth + 12) % 12));
}

export function analyzeTrends(timeline: readonly TrendPoint[], today: Date): TrendInsight {
  const monthlyProfile = buildMonthlyProfile(timeline);
  const max = Math.max(...monthlyProfile);
  const min = Math.min(...monthlyProfile);
  const seasonality = max === 0 ? 0 : (max - min) / max;
  const peakMonths = monthlyProfile.flatMap((value, month) => (value >= PEAK_THRESHOLD ? [month] : []));
  const isEvergreen = seasonality < EVERGREEN_SEASONALITY || peakMonths.length >= EVERGREEN_PEAK_MONTHS;
  const windowMonths = UPLOAD_WINDOW_DAYS.map((days) => addDays(today, days).getUTCMonth());

  return {
    monthlyProfile,
    peakMonths,
    seasonality,
    isEvergreen,
    recentAverage: Math.round(average(timeline.slice(-WEEKS_PER_YEAR).map((point) => point.value))),
    yearOverYear: computeYearOverYear(timeline),
    uploadWindowFit: Math.max(...windowMonths.map((month) => monthlyProfile[month] ?? 0)),
    monthsUntilPeak: isEvergreen ? null : monthsUntil(today.getUTCMonth(), peakMonths),
  };
}
