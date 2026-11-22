import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { getDb } from "@/lib/db/client";
import { type AdobeObservation, type AdobeSample, adobeObservations } from "@/lib/db/schema";
import { normalizeKeyword } from "@/lib/keyword";
import { currentWorkspaceId } from "@/lib/workspace/context";
import type { AdobeSortOrder } from "./search-url";

export interface NewObservation {
  keyword: string;
  assetType: AssetType;
  order: AdobeSortOrder;
  total: number;
  samples?: AdobeSample[];
  source: "extension" | "manual";
}

export interface AdobeSnapshot {
  total: number;
  observedAt: Date;
  source: AdobeObservation["source"];
}

export interface AdobeKeywordData {
  totals: Partial<Record<AssetType, AdobeSnapshot>>;
  bestSellers: Partial<Record<AssetType, { samples: AdobeSample[]; observedAt: Date }>>;
}

export async function recordObservation(observation: NewObservation): Promise<void> {
  const db = await getDb();
  await db.insert(adobeObservations).values({
    ...observation,
    workspaceId: await currentWorkspaceId(),
    keyword: normalizeKeyword(observation.keyword),
    sortOrder: observation.order,
    samples: observation.samples ?? [],
    observedAt: new Date(),
  });
}

export interface ObservationPoint {
  date: string;
  total: number;
}

export interface SaturationSeries {
  assetType: AssetType;
  points: ObservationPoint[];
  firstTotal: number;
  lastTotal: number;
  growthRatio: number;
  spanDays: number;
}

export async function getObservationHistory(keyword: string): Promise<SaturationSeries[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(adobeObservations)
    .where(
      and(
        eq(adobeObservations.workspaceId, await currentWorkspaceId()),
        eq(adobeObservations.keyword, normalizeKeyword(keyword)),
        inArray(adobeObservations.assetType, ASSET_TYPES),
      ),
    )
    .orderBy(asc(adobeObservations.observedAt));

  const byType = new Map<AssetType, Map<string, number>>();
  for (const row of rows) {
    const day = row.observedAt.toISOString().slice(0, 10);
    const series = byType.get(row.assetType) ?? new Map<string, number>();
    series.set(day, row.total);
    byType.set(row.assetType, series);
  }

  return ASSET_TYPES.flatMap((assetType) => {
    const daily = byType.get(assetType);
    if (!daily || daily.size < 2) return [];

    const points = [...daily.entries()].map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const spanDays = Math.round((Date.parse(last.date) - Date.parse(first.date)) / 86_400_000);
    return [
      {
        assetType,
        points,
        firstTotal: first.total,
        lastTotal: last.total,
        growthRatio: first.total > 0 ? (last.total - first.total) / first.total : 0,
        spanDays,
      },
    ];
  });
}

export async function getAdobeKeywordData(keyword: string): Promise<AdobeKeywordData> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(adobeObservations)
    .where(
      and(
        eq(adobeObservations.workspaceId, await currentWorkspaceId()),
        eq(adobeObservations.keyword, normalizeKeyword(keyword)),
        inArray(adobeObservations.assetType, ASSET_TYPES),
      ),
    )
    .orderBy(desc(adobeObservations.observedAt));

  const data: AdobeKeywordData = { totals: {}, bestSellers: {} };
  for (const row of rows) {
    data.totals[row.assetType] ??= { total: row.total, observedAt: row.observedAt, source: row.source };
    if (row.sortOrder === "nb_downloads" && row.samples.length > 0) {
      data.bestSellers[row.assetType] ??= { samples: row.samples, observedAt: row.observedAt };
    }
  }
  return data;
}
