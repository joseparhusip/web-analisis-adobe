"use client";

import { ExternalLink, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/calendar/events";
import type { ScheduledEvent } from "@/lib/calendar/schedule";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { countdownLabel, STATUS_CONFIG } from "./status";
import { UploadRunway } from "./upload-runway";

interface EventDialogProps {
  item: ScheduledEvent;
  now: Date;
  onClose: () => void;
}

export function EventDialog({ item, now, onClose }: EventDialogProps) {
  const { event } = item;
  const status = STATUS_CONFIG[item.status];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.name}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border bg-card shadow-xl sm:rounded-2xl"
      >
        <span className={cn("absolute inset-x-0 top-0 h-1", status.rail)} aria-hidden />

        <div className="flex items-start justify-between gap-3 border-b p-5 pt-6">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge>{CATEGORY_LABELS[event.category]}</Badge>
            </div>
            <h2 className="text-lg font-semibold">{event.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {item.approximate && "± "}
              {formatLongDate(item.date)} · {countdownLabel(item.daysUntil)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <UploadRunway item={item} now={now} />

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Keyword untuk diriset</p>
            <div className="flex flex-wrap gap-1.5">
              {event.keywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={{ pathname: "/research", query: { q: keyword } }}
                  className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition hover:text-accent"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={{ pathname: "/research", query: { q: event.keywords[0] ?? event.name } }} className={buttonClass()}>
              <Search className="size-4" />
              Riset keyword utama
            </Link>
            <a
              href={`https://stock.adobe.com/search?k=${encodeURIComponent(event.keywords[0] ?? event.name)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: "secondary" })}
            >
              <ExternalLink className="size-4" />
              Lihat di Adobe
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
