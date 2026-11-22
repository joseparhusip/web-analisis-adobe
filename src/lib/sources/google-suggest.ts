import { z } from "zod";
import { cached } from "@/lib/cache";
import { throttledFetch } from "@/lib/http/throttle";
import { normalizeKeyword } from "@/lib/keyword";
import { DAY } from "@/lib/time";

export type SuggestChannel = "web" | "youtube";

const responseSchema = z.tuple([z.string(), z.array(z.string())]).rest(z.unknown());

const ENDPOINT = "https://suggestqueries.google.com/complete/search";
const MIN_INTERVAL_MS = 250;
const TTL_MS = 3 * DAY;

async function requestSuggestions(query: string, channel: SuggestChannel): Promise<string[]> {
  const params = new URLSearchParams({ client: "firefox", hl: "en", gl: "us", ie: "utf-8", oe: "utf-8", q: query });
  if (channel === "youtube") params.set("ds", "yt");

  const response = await throttledFetch(`${ENDPOINT}?${params}`, MIN_INTERVAL_MS);
  const [, suggestions] = responseSchema.parse(await response.json());
  return suggestions.map(normalizeKeyword);
}

export async function fetchSuggestions(query: string, channel: SuggestChannel): Promise<string[]> {
  const key = `suggest:${channel}:${normalizeKeyword(query)}`;
  const { value } = await cached(key, TTL_MS, () => requestSuggestions(query, channel));
  return value;
}
