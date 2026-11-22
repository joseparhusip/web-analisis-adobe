import { z } from "zod";
import { ASSET_TYPES } from "@/lib/asset-types";
import { CONTENT_RULES } from "./creative-brief";

export const NICHE_COUNT = 8;
const LEVELS = ["low", "medium", "high"] as const;

export type NicheLevel = (typeof LEVELS)[number];

export const nicheListSchema = z.object({
  summary: z.string(),
  niches: z
    .array(
      z.object({
        keyword: z.string().min(2).max(80),
        assetType: z.enum(ASSET_TYPES),
        demand: z.enum(LEVELS),
        competition: z.enum(LEVELS),
        reason: z.string(),
      }),
    )
    .min(1),
});

export type NicheList = z.infer<typeof nicheListSchema>;
export type Niche = NicheList["niches"][number];

export const NICHE_SYSTEM_INSTRUCTION = `You are a senior Adobe Stock market analyst helping a contributor who sells to US and Western buyers.
Find under-served niches inside a theme: sub-topics that buyers clearly want but that few contributors cover well.

How to judge:
- Demand evidence: the sub-topic appears in best-selling titles, in real search phrases, or in rising searches, or it is a staple commercial need (backgrounds, isolated objects, copy space, loops, patterns).
- Competition evidence: generic head terms (the theme word alone, "background", "tree") are saturated; specific combinations of object + style + use case are less covered. The best-seller list shows what already exists in volume.
- A good niche pairs medium or high demand with low or medium competition. Never return a niche with high competition.

The contributor can only produce content that follows these rules, so every niche must be achievable within them:
${CONTENT_RULES.map((rule) => `- ${rule}`).join("\n")}

Each niche "keyword" is a 2 to 4 word English search phrase a buyer would type on Adobe Stock, in lowercase, staying inside the researched theme.
Pick the asset type where the niche has the best chance. Order niches from best to worst opportunity.
Base every niche and reason only on the research data and best-seller titles provided; do not invent demand numbers, competition figures, or trends that are not supported by the evidence. Use plain, literal language; no metaphors or hype.

Write "summary" (two sentences) and each "reason" (one or two sentences, naming the concrete evidence) in casual Indonesian.

Respond with ONLY a JSON object, no markdown fences, matching:
{"summary": string, "niches": [{"keyword": string, "assetType": "photo"|"illustration"|"vector"|"video", "demand": "medium"|"high", "competition": "low"|"medium", "reason": string}]}`;

export function buildNichePrompt(context: string, bestSellerTitles: readonly string[], focus: string | undefined): string {
  const focusLine = focus
    ? `Focus only on niches related to "${focus}" within this theme.`
    : "Cover the whole theme and vary the sub-topics.";
  const titles = bestSellerTitles.length > 0 ? bestSellerTitles.map((title) => `- ${title}`).join("\n") : "- not collected yet";

  return `Find exactly ${NICHE_COUNT} under-served niches. ${focusLine}

Research data:
${context}

Titles of current Adobe Stock best sellers for this theme:
${titles}`;
}

export function parseNicheList(text: string): NicheList {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Jawaban Gemini bukan JSON");

  const list = nicheListSchema.parse(JSON.parse(text.slice(start, end + 1)));
  return {
    ...list,
    niches: list.niches
      .filter((niche) => niche.competition !== "high")
      .slice(0, NICHE_COUNT)
      .map((niche) => ({ ...niche, keyword: niche.keyword.toLowerCase().trim() })),
  };
}
