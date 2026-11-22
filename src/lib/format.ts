const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("id-ID");
const longDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const relative = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

export const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, month, 1))),
);

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function formatNumber(value: number): string {
  return full.format(value);
}

export function formatLongDate(date: Date): string {
  return longDate.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

export function formatRelativeDays(days: number): string {
  return relative.format(days, "day");
}

export function formatPercent(ratio: number): string {
  const sign = ratio > 0 ? "+" : "";
  return `${sign}${Math.round(ratio * 100)}%`;
}
