import { z } from "zod";
import type { AssetType } from "@/lib/asset-types";
import { cached } from "@/lib/cache";
import { throttledFetch } from "@/lib/http/throttle";
import { normalizeKeyword } from "@/lib/keyword";
import { getSettings } from "@/lib/settings/settings";
import { DAY } from "@/lib/time";

export type ShutterstockTotals = Record<AssetType, number>;

const BASE_URL = "https://api.shutterstock.com/v2";
const MIN_INTERVAL_MS = 300;
const TTL_MS = 3 * DAY;

const totalSchema = z.object({ total_count: z.number() });

const ENDPOINTS: Record<AssetType, (query: string) => string> = {
  photo: (query) => `${BASE_URL}/images/search?image_type=photo&per_page=1&query=${query}`,
  illustration: (query) => `${BASE_URL}/images/search?image_type=illustration&per_page=1&query=${query}`,
  vector: (query) => `${BASE_URL}/images/search?image_type=vector&per_page=1&query=${query}`,
  video: (query) => `${BASE_URL}/videos/search?per_page=1&query=${query}`,
};

async function credentials(): Promise<string | undefined> {
  const { shutterstockClientId: id, shutterstockClientSecret: secret } = await getSettings();
  return id && secret ? Buffer.from(`${id}:${secret}`).toString("base64") : undefined;
}

export async function isShutterstockConfigured(): Promise<boolean> {
  return (await credentials()) !== undefined;
}

async function requestTotals(keyword: string, authorization: string): Promise<ShutterstockTotals> {
  const query = encodeURIComponent(keyword);
  const entries = await Promise.all(
    (Object.keys(ENDPOINTS) as AssetType[]).map(async (type) => {
      const response = await throttledFetch(ENDPOINTS[type](query), MIN_INTERVAL_MS, {
        headers: { authorization: `Basic ${authorization}` },
      });
      return [type, totalSchema.parse(await response.json()).total_count] as const;
    }),
  );
  return Object.fromEntries(entries) as ShutterstockTotals;
}

export async function fetchShutterstockTotals(keyword: string): Promise<ShutterstockTotals | null> {
  const authorization = await credentials();
  if (!authorization) return null;

  const normalized = normalizeKeyword(keyword);
  const { value } = await cached(`shutterstock:${normalized}`, TTL_MS, () => requestTotals(normalized, authorization));
  return value;
}
