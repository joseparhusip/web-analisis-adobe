import type { ThemeEvent } from "@/lib/calendar/events";
import { upcomingEvents } from "@/lib/calendar/schedule";
import { fetchTrends } from "@/lib/sources/google-trends";
import { isBuyerPhrase } from "./long-tail";
import { analyzeTrends } from "./trend-analysis";

const RADAR_LIMIT = 4;
const RISING_PER_THEME = 6;

export interface RadarItem {
  event: Pick<ThemeEvent, "id" | "name">;
  keyword: string;
  risingQueries: string[];
  yearOverYear: number | null;
  available: boolean;
}

export interface TrendRadar {
  items: RadarItem[];
  anyAvailable: boolean;
}

export async function trendRadar(now = new Date(), limit = RADAR_LIMIT): Promise<TrendRadar> {
  const events = upcomingEvents(now)
    .filter((scheduled) => scheduled.status === "upload-now")
    .slice(0, limit);

  const items: RadarItem[] = [];
  for (const scheduled of events) {
    const keyword = scheduled.event.keywords[0] ?? scheduled.event.name;
    const base = { event: { id: scheduled.event.id, name: scheduled.event.name }, keyword };
    try {
      const data = await fetchTrends(keyword);
      const insight = analyzeTrends(data.timeline, now);
      items.push({
        ...base,
        risingQueries: data.risingQueries.filter(isBuyerPhrase).slice(0, RISING_PER_THEME),
        yearOverYear: insight.yearOverYear,
        available: true,
      });
    } catch {
      items.push({ ...base, risingQueries: [], yearOverYear: null, available: false });
    }
  }

  return { items, anyAvailable: items.some((item) => item.available) };
}
