import { z } from "zod";
import { generateVision } from "./generate";
import type { InlineImage } from "./gemini";

export const assetAnalysisSchema = z.object({
  description: z.string(),
  ruleCheck: z.object({ ok: z.boolean(), issues: z.array(z.string()).max(10) }),
  adobeTitle: z.string(),
  category: z.string(),
  keywords: z.array(z.string()).max(49),
});

export type AssetAnalysis = z.infer<typeof assetAnalysisSchema>;

const ADOBE_CATEGORIES = [
  "Animals", "Buildings and Architecture", "Business", "Drinks", "The Environment", "States of Mind", "Food",
  "Graphic Resources", "Hobbies and Leisure", "Industry", "Landscapes", "Lifestyle", "People", "Plants and Flowers",
  "Culture and Religion", "Science", "Social Issues", "Sports", "Technology", "Transport", "Travel",
];

export const ASSET_SYSTEM_INSTRUCTION = `You are an Adobe Stock metadata and compliance expert. Look carefully at the image provided.

1. Compliance check for commercial stock. Set "ruleCheck.ok" to false and list each problem in "ruleCheck.issues" if you see any of:
   - identifiable real people or faces, visible hands doing recognizable gestures, or human-like IP characters
   - brand names, logos, trademarks, product packaging, or copyrighted characters/designs
   - readable text, letters, numbers, or watermarks baked into the image
   - any national flag other than the United States flag
   If none apply, set "ruleCheck.ok" to true and "issues" to an empty array.

2. "adobeTitle": one descriptive sentence under 70 characters, no keyword stuffing, describing exactly what is shown.

3. "keywords": 30 to 49 English keywords, single words or short phrases, ordered most relevant first, describing only what is visible (subject, colors, composition, mood, use case). No people-words unless people are actually visible.

4. "category": pick the single closest match from this Adobe Stock list: ${ADOBE_CATEGORIES.join(", ")}.

Base everything only on what is actually visible in the image. Do not guess, invent, or add elements that are not there. Use plain, literal language; no metaphors or flowery wording.

Write "description" (one short sentence summarizing the image) and the text of each "ruleCheck.issues" entry in casual Indonesian. Write "adobeTitle", "keywords", and "category" in English.

Respond with ONLY a JSON object, no markdown fences, matching:
{"description": string, "ruleCheck": {"ok": boolean, "issues": string[]}, "adobeTitle": string, "category": string, "keywords": string[]}`;

export function parseAssetAnalysis(text: string): AssetAnalysis {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Jawaban Gemini bukan JSON");
  return assetAnalysisSchema.parse(JSON.parse(text.slice(start, end + 1)));
}

export async function analyzeAsset(image: InlineImage): Promise<{ analysis: AssetAnalysis; model: string }> {
  const result = await generateVision(ASSET_SYSTEM_INSTRUCTION, "Analyze this image for Adobe Stock.", image);
  return { analysis: parseAssetAnalysis(result.text), model: result.model };
}
