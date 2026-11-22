"use server";

import { analyzeAsset, type AssetAnalysis } from "@/lib/ai/asset-analysis";
import { GeminiError } from "@/lib/ai/gemini";
import { analyzeReference, type ReferenceAnalysis } from "@/lib/ai/reference-analysis";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export type ImageAnalysisResult =
  | { ok: true; mode: "metadata"; analysis: AssetAnalysis; model: string }
  | { ok: true; mode: "recreate"; reference: ReferenceAnalysis; model: string }
  | { ok: false; message: string };

export async function analyzeImageAction(_: ImageAnalysisResult | null, formData: FormData): Promise<ImageAnalysisResult> {
  const mode = formData.get("mode") === "recreate" ? "recreate" : "metadata";
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pilih gambar dulu" };
  if (!ALLOWED.includes(file.type)) return { ok: false, message: "Format harus JPG, PNG, atau WEBP" };
  if (file.size > MAX_BYTES) return { ok: false, message: "Ukuran maksimal 4 MB" };

  try {
    const image = { data: Buffer.from(await file.arrayBuffer()).toString("base64"), mimeType: file.type };
    if (mode === "recreate") {
      const count = Number(formData.get("count")) || 3;
      const { analysis, model } = await analyzeReference(image, count);
      return { ok: true, mode: "recreate", reference: analysis, model };
    }
    const { analysis, model } = await analyzeAsset(image);
    return { ok: true, mode: "metadata", analysis, model };
  } catch (error) {
    if (error instanceof GeminiError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: "Gagal menganalisis gambar. Coba lagi." };
  }
}
