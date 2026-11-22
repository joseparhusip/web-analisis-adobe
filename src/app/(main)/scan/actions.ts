"use server";

import { type BulkRow, scanKeywords } from "@/lib/research/bulk";
import { parseKeywordInput } from "@/lib/research/bulk-input";

export type ScanResult = { ok: true; rows: BulkRow[] } | { ok: false; message: string };

export async function scanKeywordsAction(_: ScanResult | null, formData: FormData): Promise<ScanResult> {
  const keywords = parseKeywordInput(String(formData.get("keywords") ?? ""));
  if (keywords.length === 0) return { ok: false, message: "Masukkan minimal satu keyword" };

  try {
    return { ok: true, rows: await scanKeywords(keywords) };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Gagal memindai. Coba lagi atau kurangi jumlah keyword." };
  }
}
