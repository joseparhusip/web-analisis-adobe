import { ASSET_TYPE_META } from "@/lib/asset-types";
import { upcomingEvents } from "@/lib/calendar/schedule";
import { MONTH_NAMES, formatPercent } from "@/lib/format";
import { keywordTokens } from "@/lib/keyword";
import type { Scoreboard } from "@/lib/research/service";
import type { TitlePattern } from "@/lib/research/title-patterns";

const UPCOMING_EVENT_LIMIT = 6;
const TITLE_PATTERN_LIMIT = 12;

function relatedEvents(keyword: string): string[] {
  const tokens = keywordTokens(keyword);
  const events = upcomingEvents();
  const matching = events.filter(({ event }) =>
    [event.name.toLowerCase(), ...event.keywords].some((text) => tokens.some((token) => text.includes(token))),
  );
  const inWindow = events.filter((item) => item.status === "upload-now");

  return [...new Set([...matching, ...inWindow])]
    .slice(0, UPCOMING_EVENT_LIMIT)
    .map((item) => `${item.event.name} (${item.date.toISOString().slice(0, 10)}, ${item.daysUntil} days away)`);
}

function scoreLines(scoreboard: Scoreboard): string[] {
  return scoreboard.scores.map((score) => {
    const total = score.competitionEntry ? `${score.competitionEntry.total} existing assets` : "asset count unknown";
    return `- ${ASSET_TYPE_META[score.assetType].label}: demand ${score.demand}/100, competition ${score.competition ?? "?"}/100, opportunity ${score.opportunity ?? "?"}/100, ${total}`;
  });
}

function trendLines(scoreboard: Scoreboard): string[] {
  if (scoreboard.trends.status !== "ok") return ["- Google Trends data unavailable"];
  const { insight, data } = scoreboard.trends;
  return [
    `- Pattern: ${insight.isEvergreen ? "evergreen" : "seasonal"}`,
    `- Peak months (US): ${insight.peakMonths.map((month) => MONTH_NAMES[month]).join(", ") || "none"}`,
    `- Year over year: ${insight.yearOverYear === null ? "unknown" : formatPercent(insight.yearOverYear)}`,
    `- Rising related searches: ${data.risingQueries.slice(0, 8).join(", ") || "none"}`,
  ];
}

export function buildResearchContext(keyword: string, scoreboard: Scoreboard, patterns: readonly TitlePattern[]): string {
  return [
    `Keyword: "${keyword}"`,
    "Target market: United States and Western buyers on Adobe Stock.",
    "",
    "Opportunity scores per asset type:",
    ...scoreLines(scoreboard),
    "",
    "Search trend (Google Trends, US, 5 years):",
    ...trendLines(scoreboard),
    "",
    `Long-tail searches people type: ${scoreboard.longTail.keywords.map((item) => item.phrase).join(", ") || "none"}`,
    `Frequent words in best-selling Adobe Stock titles: ${patterns.slice(0, TITLE_PATTERN_LIMIT).map((item) => item.phrase).join(", ") || "not collected yet"}`,
    `Upcoming events in the upload window: ${relatedEvents(keyword).join("; ") || "none"}`,
  ].join("\n");
}
