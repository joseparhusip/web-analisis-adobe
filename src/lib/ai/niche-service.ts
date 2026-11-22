import { getAdobeKeywordData } from "@/lib/adobe/observations";
import { peekCache, writeCache } from "@/lib/cache";
import { normalizeKeyword } from "@/lib/keyword";
import { competitionScore } from "@/lib/research/scoring";
import { buildScoreboard } from "@/lib/research/service";
import { extractTitlePatterns } from "@/lib/research/title-patterns";
import { generateText } from "./generate";
import { buildNichePrompt, NICHE_SYSTEM_INSTRUCTION, type Niche, type NicheLevel, parseNicheList } from "./niche-finder";
import { currentWorkspaceId } from "@/lib/workspace/context";
import { buildResearchContext } from "./research-context";

export interface MeasuredCompetition {
  total: number;
  level: NicheLevel;
}

export interface NicheEntry extends Niche {
  measured?: MeasuredCompetition;
}

export interface StoredNiches {
  summary: string;
  niches: Niche[];
  focus?: string;
  model: string;
  generatedAt: string;
}

export interface NicheReport extends Omit<StoredNiches, "niches"> {
  niches: NicheEntry[];
}

const MAX_TITLES = 150;
const MAX_TITLE_LENGTH = 100;
const LOW_COMPETITION_SCORE = 45;
const MEDIUM_COMPETITION_SCORE = 65;

const cacheKey = async (keyword: string) => `niches:${await currentWorkspaceId()}:${normalizeKeyword(keyword)}`;

function levelFor(total: number): NicheLevel {
  const score = competitionScore(total);
  if (score < LOW_COMPETITION_SCORE) return "low";
  return score < MEDIUM_COMPETITION_SCORE ? "medium" : "high";
}

async function withMeasurement(niche: Niche): Promise<NicheEntry> {
  const { totals } = await getAdobeKeywordData(niche.keyword);
  const total = totals[niche.assetType]?.total;
  return total === undefined ? niche : { ...niche, measured: { total, level: levelFor(total) } };
}

async function toReport(stored: StoredNiches): Promise<NicheReport> {
  return { ...stored, niches: await Promise.all(stored.niches.map(withMeasurement)) };
}

export async function getNicheReport(keyword: string): Promise<NicheReport | undefined> {
  const stored = (await peekCache<StoredNiches>(await cacheKey(keyword)))?.value;
  return stored && toReport(stored);
}

export async function generateNiches(keyword: string, focus: string | undefined): Promise<NicheReport> {
  const [scoreboard, adobe] = await Promise.all([buildScoreboard(keyword), getAdobeKeywordData(keyword)]);
  const titles = Object.values(adobe.bestSellers)
    .flatMap((entry) => entry.samples.map((sample) => sample.title.slice(0, MAX_TITLE_LENGTH)))
    .slice(0, MAX_TITLES);
  const context = buildResearchContext(keyword, scoreboard, extractTitlePatterns(titles, keyword));

  const result = await generateText(NICHE_SYSTEM_INSTRUCTION, buildNichePrompt(context, titles, focus));
  const stored: StoredNiches = {
    ...parseNicheList(result.text),
    focus,
    model: result.model,
    generatedAt: new Date().toISOString(),
  };
  await writeCache(await cacheKey(keyword), stored);
  return toReport(stored);
}
