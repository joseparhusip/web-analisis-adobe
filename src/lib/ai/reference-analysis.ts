import { z } from "zod";
import { ASSET_TYPES } from "@/lib/asset-types";
import { generateVision } from "./generate";
import type { InlineImage } from "./gemini";

export const REFERENCE_VARIANT_MAX = 10;
export const REFERENCE_VARIANT_DEFAULT = 3;

export const referenceAnalysisSchema = z.object({
  description: z.string(),
  subject: z.string(),
  assetType: z.enum(ASSET_TYPES),
  style: z.string(),
  note: z.string(),
  variants: z
    .array(z.object({ name: z.string(), flowPrompt: z.string() }))
    .min(1),
});

export type ReferenceAnalysis = z.infer<typeof referenceAnalysisSchema>;
export type ReferenceVariant = ReferenceAnalysis["variants"][number];

function clampCount(count: number): number {
  return Math.min(Math.max(Math.round(count), 1), REFERENCE_VARIANT_MAX);
}

export function referenceSystemInstruction(count: number): string {
  const total = clampCount(count);
  return `You are a stock creative director helping a contributor study a reference asset using the "amati, tiru, modifikasi" (observe, imitate, modify) method. Look at the image.

Produce:
1. "description": what this image is, in one or two sentences (Indonesian).
2. "subject": the main subject in a few words (Indonesian).
3. "assetType": one of photo, illustration, vector, video — the closest match to the image's style.
4. "style": the style, composition, camera angle, lighting, color palette, and mood (Indonesian).
5. "note": one short reminder (Indonesian) that the goal is inspiration, not copying, and the result must stay legally distinct.
6. "variants": EXACTLY ${total} recreation ${total === 1 ? "concept" : "concepts"}.

CRITICAL — keep the SAME theme: every variant MUST stay in the exact same theme, same occasion or season, same subject category, and the same dominant color identity and overall mood as the reference. If the reference is a red-and-gold Christmas poster, every variant is still a red-and-gold Christmas poster. NEVER change the holiday, the season, or the dominant color scheme (do not turn a red Christmas scene into blue winter, green, or another holiday).

Between variants, change only SPECIFIC ELEMENTS so each result is a distinct original arrangement, for example: the layout and composition, how the props are arranged (e.g. the way the gift boxes are stacked or positioned), the shape and style of the ornaments, the type of decorative accents within the same palette, the framing and where the empty copy space sits, or small details added or removed. Each variant should change a DIFFERENT element or combination from the others.

Each variant has:
- "name": a short Indonesian label naming exactly which element is changed (for example "Kado ditata melingkar di bawah", "Ornamen bentuk bintang & lonceng", "Bingkai cemara penuh di sisi kiri").
- "flowPrompt": an English Google Flow prompt of 190 to 250 words, written as full descriptive sentences in this order: hero subject and its exact details, composition and framing, background, lighting (source, direction, softness), color palette with named colors, mood and atmosphere, rendering style and quality, aspect ratio. Keep the same theme and palette as the reference; be concrete about the specific element you changed. Use plain, literal, concrete language; do not use metaphors, similes, or poetic phrasing. Describe only what can actually be rendered, and base every detail on what is visible in the reference; do not invent facts, brands, or real places.

Rules for every prompt: do not reproduce the exact identical arrangement of the original, do not imitate any specific named artist or studio style, and never include brand names, logos, trademarks, or readable text. If people appear, make them fictional, diverse, and non-identifiable.

Respond with ONLY a JSON object, no markdown fences, matching:
{"description": string, "subject": string, "assetType": "photo"|"illustration"|"vector"|"video", "style": string, "note": string, "variants": [{"name": string, "flowPrompt": string}]}`;
}

export function parseReferenceAnalysis(text: string, count: number): ReferenceAnalysis {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Jawaban Gemini bukan JSON");

  const parsed = referenceAnalysisSchema.parse(JSON.parse(text.slice(start, end + 1)));
  return { ...parsed, variants: parsed.variants.slice(0, clampCount(count)) };
}

export async function analyzeReference(
  image: InlineImage,
  count: number,
): Promise<{ analysis: ReferenceAnalysis; model: string }> {
  const result = await generateVision(
    referenceSystemInstruction(count),
    "Study this reference image for amati-tiru-modifikasi and give the variants.",
    image,
  );
  return { analysis: parseReferenceAnalysis(result.text, count), model: result.model };
}
