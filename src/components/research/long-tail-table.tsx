"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";
import { ASSET_TYPE_META, ASSET_TYPES, type AssetType } from "@/lib/asset-types";
import type { LongTailKeyword } from "@/lib/research/long-tail";
import { cn } from "@/lib/utils";

const CHANNEL_LABELS = { web: "Google", youtube: "YouTube" } as const;

type Filter = AssetType | "all";

export function LongTailTable({ keywords }: { keywords: LongTailKeyword[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(
    () => (filter === "all" ? keywords : keywords.filter((item) => item.assetTypes.includes(filter))),
    [filter, keywords],
  );

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Semua", count: keywords.length },
    ...ASSET_TYPES.map((type) => ({
      value: type,
      label: ASSET_TYPE_META[type].label,
      count: keywords.filter((item) => item.assetTypes.includes(type)).length,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition",
              filter === option.value ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted",
            )}
          >
            {option.label} <span className="tabular-nums opacity-70">{option.count}</span>
          </button>
        ))}
        <span className="ml-auto">
          <CopyButton text={visible.map((item) => item.phrase).join("\n")} label="Copy daftar" />
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState>Tidak ada keyword untuk tipe ini.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4 font-medium">Keyword</th>
                <th className="py-2 pr-4 font-medium">Sinyal tipe aset</th>
                <th className="py-2 pr-4 font-medium">Sumber</th>
                <th className="py-2 text-right font-medium">Kekuatan</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.phrase} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <Link href={{ pathname: "/research", query: { q: item.phrase } }} className="hover:text-accent hover:underline">
                      {item.phrase}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="flex flex-wrap gap-1">
                      {item.assetTypes.map((type) => (
                        <Badge key={type}>{ASSET_TYPE_META[type].label}</Badge>
                      ))}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">
                    {item.channels.map((channel) => CHANNEL_LABELS[channel]).join(", ")}
                  </td>
                  <td className="py-2 text-right tabular-nums">{item.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
