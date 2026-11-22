import { MONTH_NAMES, formatPercent } from "@/lib/format";
import type { TrendInsight } from "./trend-analysis";

export type FindingTone = "good" | "warn" | "info";

export interface TrendFinding {
  tone: FindingTone;
  title: string;
  text: string;
}

const UPLOAD_LEAD_MONTHS = [3, 2];
const YEARLY_CHANGE_THRESHOLD = 0.1;

const monthName = (month: number) => MONTH_NAMES[((month % 12) + 12) % 12]!;

function nextPeakMonth(insight: TrendInsight, currentMonth: number): number | null {
  return insight.monthsUntilPeak === null ? null : (currentMonth + insight.monthsUntilPeak) % 12;
}

function patternFinding(insight: TrendInsight): TrendFinding {
  if (insight.isEvergreen) {
    return {
      tone: "good",
      title: "Evergreen",
      text: `Dicari sepanjang tahun: di bulan tersepi minat masih ${Math.min(...insight.monthlyProfile)}% dari puncak. Bisa diupload kapan saja dan terus menghasilkan.`,
    };
  }
  const lowest = Math.min(...insight.monthlyProfile);
  return {
    tone: "info",
    title: "Musiman",
    text: `Minat memuncak di ${insight.peakMonths.map(monthName).join(", ")}. Di bulan tersepi minat tinggal ${lowest}% dari puncak, jadi penjualan terkumpul di musimnya.`,
  };
}

function timingFinding(insight: TrendInsight, currentMonth: number): TrendFinding | undefined {
  const peak = nextPeakMonth(insight, currentMonth);
  if (peak === null || insight.monthsUntilPeak === null) return undefined;

  const uploadMonths = UPLOAD_LEAD_MONTHS.map((lead) => monthName(peak - lead)).join("–");
  if (insight.monthsUntilPeak <= 1) {
    return {
      tone: "warn",
      title: "Sudah di musimnya",
      text: `Puncak ${monthName(peak)} sudah dekat atau sedang berlangsung. Upload sekarang masih bisa kebagian sisa musim, tapi waktu idealnya ${uploadMonths}. Catat untuk tahun depan.`,
    };
  }
  if (insight.monthsUntilPeak <= 3) {
    return {
      tone: "good",
      title: "Waktu terbaik upload",
      text: `Puncak berikutnya ${monthName(peak)}, ${insight.monthsUntilPeak} bulan lagi. Pembeli mulai mencari sekarang, jadi ini jendela upload yang paling pas.`,
    };
  }
  return {
    tone: "info",
    title: "Belum musimnya",
    text: `Puncak berikutnya ${monthName(peak)}, ${insight.monthsUntilPeak} bulan lagi. Mulai upload sekitar ${uploadMonths}.`,
  };
}

function momentumFinding(insight: TrendInsight): TrendFinding | undefined {
  if (insight.yearOverYear === null) return undefined;
  const change = formatPercent(insight.yearOverYear);

  if (insight.yearOverYear >= YEARLY_CHANGE_THRESHOLD) {
    return { tone: "good", title: "Tren naik", text: `Minat 12 bulan terakhir ${change} dibanding tahun sebelumnya. Temanya sedang membesar.` };
  }
  if (insight.yearOverYear <= -YEARLY_CHANGE_THRESHOLD) {
    return { tone: "warn", title: "Tren turun", text: `Minat 12 bulan terakhir ${change} dibanding tahun sebelumnya. Pilih sudut yang lebih spesifik supaya tetap dicari.` };
  }
  return { tone: "info", title: "Tren stabil", text: `Minat 12 bulan terakhir ${change} dibanding tahun sebelumnya, relatif sama.` };
}

function currentLevelFinding(insight: TrendInsight, currentMonth: number): TrendFinding {
  const level = insight.monthlyProfile[currentMonth] ?? 0;
  return {
    tone: level >= 60 ? "good" : "info",
    title: "Posisi bulan ini",
    text: `Rata-rata minat di ${monthName(currentMonth)} sekitar ${level}% dari bulan puncak.`,
  };
}

export function describeTrend(insight: TrendInsight, today: Date): TrendFinding[] {
  const currentMonth = today.getUTCMonth();
  return [
    patternFinding(insight),
    timingFinding(insight, currentMonth),
    currentLevelFinding(insight, currentMonth),
    momentumFinding(insight),
  ].filter((finding): finding is TrendFinding => finding !== undefined);
}
