"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SaturationSeries } from "@/lib/adobe/observations";
import { ASSET_TYPE_META, type AssetType } from "@/lib/asset-types";
import { formatCompact } from "@/lib/format";

export const SERIES_COLORS: Record<AssetType, string> = {
  photo: "#6366f1",
  illustration: "#0d9488",
  vector: "#d97706",
  video: "#db2777",
};

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

interface Row {
  date: string;
  [assetType: string]: number | string;
}

function mergeByDate(series: SaturationSeries[]): Row[] {
  const byDate = new Map<string, Row>();
  for (const line of series) {
    for (const point of line.points) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[line.assetType] = point.total;
      byDate.set(point.date, row);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function SaturationChart({ series }: { series: SaturationSeries[] }) {
  const data = mergeByDate(series);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" {...AXIS} minTickGap={32} tickFormatter={(value: string) => dateFormatter.format(new Date(value))} />
        <YAxis {...AXIS} width={44} tickFormatter={(value: number) => formatCompact(value)} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelFormatter={(value) => dateFormatter.format(new Date(String(value)))}
          formatter={(value, name) => [formatCompact(Number(value)), ASSET_TYPE_META[name as AssetType].label]}
        />
        {series.map((line) => (
          <Line
            key={line.assetType}
            type="monotone"
            dataKey={line.assetType}
            stroke={SERIES_COLORS[line.assetType]}
            strokeWidth={2}
            dot={{ r: 2.5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
