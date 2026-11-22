import { z } from "zod";
import { ASSET_TYPE_META, ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import { MAX_PROMPT_COUNT } from "./prompt-options";

export const creativeBriefSchema = z.object({
  englishKeyword: z.string(),
  analysis: z.object({
    summary: z.string(),
    buyerIntent: z.string(),
    recommendedAssetType: z.enum(ASSET_TYPES),
    timing: z.string(),
    tips: z.array(z.string()).max(5),
  }),
  concepts: z
    .array(
      z.object({
        name: z.string(),
        assetType: z.enum(ASSET_TYPES),
        reason: z.string(),
        flowPrompt: z.string(),
        adobeTitle: z.string(),
        keywords: z.array(z.string()).max(49),
      }),
    )
    .min(1),
});

export type CreativeBrief = z.infer<typeof creativeBriefSchema>;

const THEME_RULES = [
  "The researched keyword is the hero subject of every concept and must be instantly recognizable as that theme at thumbnail size.",
  "Place the subject in its natural, iconic setting. Example: a snowman stands outdoors on fresh snow with a soft winter sky or gentle snowfall, never on a table or indoors.",
  "Every supporting element must be something buyers naturally associate with the theme. Example for a snowman: carrot nose, coal buttons, scarf, knit hat, twig arms, snowflakes, snow-covered pine trees.",
  "Never add random or loosely related props. Example for a snowman: no acorns, nuts, seeds, squirrels, spices, food, candles, or unrelated decorations.",
  "Before answering, re-read each prompt and delete any object that a buyer searching this keyword would not expect to see.",
];

export const CONTENT_RULES = [
  "Absolutely no people: no humans, faces, hands, body parts, silhouettes, or human-like characters (Santa Claus, elves, angels). Objects, food, plants, animals, and snowmen are fine.",
  "No intellectual property: no Disney, Pixar, Marvel, movie or cartoon characters (e.g. Olaf, Frozen), no brands, logos, trademarked products, branded packaging, or famous protected designs.",
  "No national flags except the United States flag, which is allowed.",
  "No text, letters, numbers, or watermarks in the visual.",
  "Minimal, clean, uncluttered background that still matches the theme's natural setting (for example a smooth snowfield under a soft plain sky), or a solid color or soft gradient when the subject is isolated.",
  "One clear hero subject with at most two or three theme-appropriate supporting elements; never crowded.",
  "Choose the composition that best fits the subject: centered, rule of thirds, or offset with negative space for copy.",
  "Western/US look and feel.",
];

const TYPE_GUIDES: Record<AssetType, string> = {
  photo:
    "Photorealistic commercial stock photography of objects or scenes without people: specify lens (e.g. 50mm, 85mm macro), depth of field, lighting setup, surface/material, and aspect ratio 3:2 or 16:9.",
  illustration:
    "Digital illustration (choose one style that fits: soft 3D render, paper cut, watercolor, or clay): specify the style, lighting, palette, and aspect ratio.",
  vector:
    "Flat vector illustration: solid flat colors, clean geometric shapes, no gradients or textures, limited palette of 3 to 5 colors, on a plain white or single flat color background so it can be traced in Illustrator; a simple ground shape and a few flat theme accents (such as snow mounds or snowflakes) are allowed; aspect ratio 1:1.",
  video:
    "One continuous 8-second shot for Veo: describe the subject, a single slow camera movement (slow push-in, orbit, or static), subtle motion (falling snow, drifting bokeh, flickering light), lighting, and state 'seamless loop' when it suits a background; aspect ratio 16:9.",
};

const PROMPT_STRUCTURE = [
  "Each flowPrompt is one rich, highly specific paragraph of 160 to 220 words, written as full descriptive sentences.",
  "Cover, in this order: (1) the hero subject with exact details: shape, size, materials, textures, colors, and the exact number and placement of each supporting element; (2) the setting and ground surface; (3) composition, framing, camera angle, and where the negative space sits; (4) background and depth; (5) lighting: source, direction, softness, time of day; (6) color palette with three to five named colors; (7) mood and atmosphere; (8) style, rendering quality, and aspect ratio; for video also the motion and camera movement second by second.",
  "Be concrete, never vague: write 'three round coal buttons in a vertical row' instead of 'some buttons'.",
  "End every prompt with: 'No people, no faces, no hands, no text, no logos, no brand names, no unrelated objects.'",
].join(" ");

function clampCount(count: number): number {
  return Math.min(Math.max(Math.round(count), 1), MAX_PROMPT_COUNT);
}

function conceptWord(count: number): string {
  return count === 1 ? "concept" : "different concepts";
}

function rulesList(): string {
  return [...THEME_RULES, ...CONTENT_RULES].map((rule) => `- ${rule}`).join("\n");
}

export function buildSystemInstruction(assetType: AssetType, count: number): string {
  const label = ASSET_TYPE_META[assetType].label;
  const total = clampCount(count);
  return `You are a senior Adobe Stock market analyst and creative director for a contributor selling to US and Western buyers.
If Google Search is available, use it to check what is currently trending and selling for this theme; otherwise rely on the research data and your market knowledge.

The contributor wants ${label.toUpperCase()} assets only. Every concept must have "assetType": "${assetType}".

Theme and content rules for every concept and prompt (the examples use a snowman; apply the same logic to the actual keyword):
${rulesList()}

Google Flow format for ${label}:
- ${TYPE_GUIDES[assetType]}
- ${PROMPT_STRUCTURE}

Write "analysis" and "reason" fields in casual Indonesian. Write "flowPrompt", "adobeTitle", "keywords", and "englishKeyword" in English.
"englishKeyword" is the best English search term for the theme (translate if the input is not English).
Give exactly ${total} ${conceptWord(total)} ordered from highest to lowest sales potential.
"adobeTitle" is under 70 characters, descriptive, no keyword stuffing. "keywords" are 25-40 single words or short phrases describing only what is visible, most important first, without people-related words.

Respond with ONLY a JSON object, no markdown fences, matching:
{"englishKeyword": string, "analysis": {"summary": string, "buyerIntent": string, "recommendedAssetType": "photo"|"illustration"|"vector"|"video", "timing": string, "tips": string[]}, "concepts": [{"name": string, "assetType": "${assetType}", "reason": string, "flowPrompt": string, "adobeTitle": string, "keywords": string[]}]}`;
}

export function buildBriefPrompt(context: string, assetType: AssetType, count: number): string {
  const total = clampCount(count);
  return `Analyze this Adobe Stock research data and produce ${total} ${ASSET_TYPE_META[assetType].label} ${conceptWord(total)}.\n\n${context}`;
}

export function parseCreativeBrief(text: string, assetType: AssetType, count: number): CreativeBrief {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Jawaban Gemini bukan JSON");

  const brief = creativeBriefSchema.parse(JSON.parse(text.slice(start, end + 1)));
  return {
    ...brief,
    concepts: brief.concepts.slice(0, clampCount(count)).map((concept) => ({ ...concept, assetType })),
  };
}

export function buildChatGptPrompt(context: string, assetType: AssetType, count: number): string {
  const label = ASSET_TYPE_META[assetType].label;
  const total = clampCount(count);
  return `You are a senior Adobe Stock creative director. I sell stock content to US and Western buyers and generate it with Google Flow.

Based on the research data below:
1. Briefly analyze (in Indonesian) what buyers want for this theme.
2. Write ${total} ready-to-paste Google Flow ${total === 1 ? "prompt" : "prompts"} for ${label.toUpperCase()} assets only, in English, ordered by sales potential. For each: concept name, the prompt, an Adobe Stock title under 70 characters, and 30 keywords.

Theme and content rules (the examples use a snowman; apply the same logic to the actual keyword):
${rulesList()}

Format:
- ${TYPE_GUIDES[assetType]}
- ${PROMPT_STRUCTURE}

Research data:
${context}`;
}
