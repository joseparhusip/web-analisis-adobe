"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MONTH_NAMES } from "@/lib/format";
import type { TrendPoint } from "@/lib/sources/google-trends";

const AXIS_PROPS = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
} as const;

const yearFormatter = new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "UTC" });
const dayFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function InterestTimeline({ timeline }: { timeline: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          {...AXIS_PROPS}
          minTickGap={48}
          tickFormatter={(value: string) => yearFormatter.format(new Date(value))}
        />
        <YAxis {...AXIS_PROPS} domain={[0, 100]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(value) => dayFormatter.format(new Date(String(value)))}
          formatter={(value) => [value, "Minat"]}
        />
        <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={1.75} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface MonthlyProfileProps {
  profile: number[];
  peakMonths: number[];
}

export function MonthlyProfile({ profile, peakMonths }: MonthlyProfileProps) {
  const data = profile.map((value, month) => ({ month: MONTH_NAMES[month], value, isPeak: peakMonths.includes(month) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} interval={0} />
        <YAxis {...AXIS_PROPS} domain={[0, 100]} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} formatter={(value) => [value, "Rata-rata minat"]} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.month} fill={entry.isPeak ? "var(--chart-1)" : "var(--chart-2)"} fillOpacity={entry.isPeak ? 1 : 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
