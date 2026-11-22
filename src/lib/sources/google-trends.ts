import { z } from "zod";
import { cached, peekCache } from "@/lib/cache";
import { BROWSER_USER_AGENT, HttpError, throttledFetch } from "@/lib/http/throttle";
import { normalizeKeyword } from "@/lib/keyword";
import { singleton } from "@/lib/singleton";
import { DAY, HOUR, MINUTE } from "@/lib/time";

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendsData {
  timeline: TrendPoint[];
  topQueries: string[];
  risingQueries: string[];
}

export class TrendsUnavailableError extends Error {
  constructor(readonly retryAt: Date) {
    super("Google Trends sedang membatasi request");
    this.name = "TrendsUnavailableError";
  }
}

export const TRENDS_GEO = "US";

const SITE_URL = "https://trends.google.com/trends";
const API_URL = `${SITE_URL}/api`;
const MIN_INTERVAL_MS = 1_500;
const TTL_MS = 7 * DAY;
const COOLDOWN_MS = 5 * MINUTE;
const SESSION_TTL_MS = HOUR;

const widgetSchema = z.object({ id: z.string(), token: z.string(), request: z.unknown() });
const exploreSchema = z.object({ widgets: z.array(widgetSchema) });
const timelineSchema = z.object({
  default: z.object({
    timelineData: z.array(z.object({ time: z.string(), value: z.array(z.number()) })),
  }),
});
const relatedSchema = z.object({
  default: z.object({
    rankedList: z.array(z.object({ rankedKeyword: z.array(z.object({ query: z.string() })) })),
  }),
});

const session = singleton("trends-session", () => ({ cookie: "", obtainedAt: 0, cooldownUntil: 0 }));

function parseGuardedJson(text: string): unknown {
  return JSON.parse(text.slice(text.indexOf("{")));
}

async function sessionCookie(): Promise<string> {
  if (session.cookie && Date.now() - session.obtainedAt < SESSION_TTL_MS) return session.cookie;

  const response = await fetch(`${SITE_URL}/?geo=${TRENDS_GEO}`, {
    headers: { "user-agent": BROWSER_USER_AGENT, "accept-language": "en-US,en;q=0.9" },
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  session.cookie = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
  session.obtainedAt = Date.now();
  return session.cookie;
}

async function requestApi(path: string, params: Record<string, string>): Promise<unknown> {
  const query = new URLSearchParams({ hl: "en-US", tz: "0", ...params });
  const response = await throttledFetch(`${API_URL}/${path}?${query}`, MIN_INTERVAL_MS, {
    headers: { cookie: await sessionCookie(), referer: `${SITE_URL}/explore` },
  });
  return parseGuardedJson(await response.text());
}

const isRateLimited = (error: unknown) => error instanceof HttpError && error.status === 429;

async function callTrends(path: string, params: Record<string, string>): Promise<unknown> {
  if (Date.now() < session.cooldownUntil) throw new TrendsUnavailableError(new Date(session.cooldownUntil));

  try {
    return await requestApi(path, params);
  } catch (error) {
    if (!isRateLimited(error)) throw error;
  }

  session.obtainedAt = 0;
  try {
    return await requestApi(path, params);
  } catch (error) {
    if (!isRateLimited(error)) throw error;
    session.cooldownUntil = Date.now() + COOLDOWN_MS;
    throw new TrendsUnavailableError(new Date(session.cooldownUntil));
  }
}

async function requestTrends(keyword: string): Promise<TrendsData> {
  const explore = exploreSchema.parse(
    await callTrends("explore", {
      req: JSON.stringify({
        comparisonItem: [{ keyword, geo: TRENDS_GEO, time: "today 5-y" }],
        category: 0,
        property: "",
      }),
    }),
  );

  const widget = (id: string) => {
    const found = explore.widgets.find((item) => item.id === id);
    if (!found) throw new Error(`Widget Trends ${id} tidak ditemukan`);
    return { req: JSON.stringify(found.request), token: found.token };
  };

  const timeline = timelineSchema.parse(await callTrends("widgetdata/multiline", widget("TIMESERIES")));
  const related = await callTrends("widgetdata/relatedsearches", widget("RELATED_QUERIES"))
    .then((body) => relatedSchema.parse(body).default.rankedList)
    .catch(() => []);
  const [top, rising] = related.map((list) => list.rankedKeyword.map((item) => normalizeKeyword(item.query)));

  return {
    timeline: timeline.default.timelineData.map((point) => ({
      date: new Date(Number(point.time) * 1000).toISOString().slice(0, 10),
      value: point.value[0] ?? 0,
    })),
    topQueries: top ?? [],
    risingQueries: rising ?? [],
  };
}

const cacheKey = (keyword: string) => `trends:${TRENDS_GEO}:${normalizeKeyword(keyword)}`;

export async function fetchTrends(keyword: string): Promise<TrendsData> {
  const { value } = await cached(cacheKey(keyword), TTL_MS, () => requestTrends(normalizeKeyword(keyword)));
  return value;
}

export async function hasCachedTrends(keyword: string): Promise<boolean> {
  return (await peekCache(cacheKey(keyword))) !== undefined;
}
