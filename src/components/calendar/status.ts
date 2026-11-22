import type { Tone } from "@/components/ui/badge";
import type { UploadStatus } from "@/lib/calendar/schedule";

export interface StatusConfig {
  label: string;
  tone: Tone;
  rail: string;
  dot: string;
  chip: string;
}

export const STATUS_CONFIG: Record<UploadStatus, StatusConfig> = {
  "upload-now": { label: "Waktunya upload", tone: "success", rail: "bg-success", dot: "bg-success", chip: "bg-success-soft text-success" },
  prepare: { label: "Siapkan konsep", tone: "accent", rail: "bg-accent", dot: "bg-accent", chip: "bg-accent-soft text-accent" },
  "too-late": { label: "Mepet", tone: "warning", rail: "bg-warning", dot: "bg-warning", chip: "bg-warning-soft text-warning" },
  later: { label: "Nanti", tone: "neutral", rail: "bg-border", dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" },
  past: { label: "Sudah lewat", tone: "neutral", rail: "bg-border", dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" },
};

export const LEGEND_STATUSES: UploadStatus[] = ["upload-now", "too-late", "prepare", "later"];

export function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return "hari ini";
  return daysUntil > 0 ? `${daysUntil} hari lagi` : `${-daysUntil} hari lalu`;
}
