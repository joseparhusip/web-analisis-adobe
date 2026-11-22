"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { refreshScoreAction, removeKeywordAction, updateTagsAction } from "@/app/(main)/keywords/actions";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ASSET_TYPE_META, ASSET_TYPES, isAssetType } from "@/lib/asset-types";
import { formatRelativeDays } from "@/lib/format";
import { daysBetween } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface KeywordRow {
  id: number;
  keyword: string;
  tags: string[];
  bestAssetType: string | null;
  bestScore: number | null;
  scores: Record<string, number | null> | null;
  scoredAt: Date | null;
}

export function KeywordTable({ rows }: { rows: KeywordRow[] }) {
  const [activeTag, setActiveTag] = useState<string>();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());

  const tags = useMemo(() => [...new Set(rows.flatMap((row) => row.tags))].sort(), [rows]);
  const visible = rows.filter(
    (row) => (!activeTag || row.tags.includes(activeTag)) && row.keyword.includes(query.trim().toLowerCase()),
  );
  const copyTarget = visible.filter((row) => selected.size === 0 || selected.has(row.id));

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  if (rows.length === 0) {
    return <EmptyState>Belum ada keyword tersimpan. Simpan dari halaman Riset Keyword.</EmptyState>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari keyword" className="h-8 w-48 text-xs" />
        <TagFilter label="Semua" active={!activeTag} onClick={() => setActiveTag(undefined)} />
        {tags.map((tag) => (
          <TagFilter key={tag} label={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)} />
        ))}
        <span className="ml-auto">
          <CopyButton
            text={copyTarget.map((row) => row.keyword).join(", ")}
            label={selected.size > 0 ? `Copy ${selected.size} terpilih` : `Copy ${copyTarget.length} keyword`}
          />
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="w-8 py-2" />
              <th className="py-2 pr-4 font-medium">Keyword</th>
              <th className="py-2 pr-4 font-medium">Tag</th>
              {ASSET_TYPES.map((type) => (
                <th key={type} className="py-2 pr-4 text-right font-medium">
                  {ASSET_TYPE_META[type].label}
                </th>
              ))}
              <th className="py-2 pr-4 font-medium">Terbaik</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <KeywordRowView key={row.id} row={row} selected={selected.has(row.id)} onToggle={() => toggle(row.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagFilter({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs transition",
        active ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

interface KeywordRowViewProps {
  row: KeywordRow;
  selected: boolean;
  onToggle: () => void;
}

function KeywordRowView({ row, selected, onToggle }: KeywordRowViewProps) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const saveTags = (value: string) => {
    setEditing(false);
    if (value !== row.tags.join(", ")) startTransition(() => updateTagsAction(row.id, value));
  };

  return (
    <tr className={cn("border-b last:border-0", pending && "opacity-50")}>
      <td className="py-2">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Pilih ${row.keyword}`} className="accent-accent" />
      </td>
      <td className="py-2 pr-4">
        <Link href={{ pathname: "/research", query: { q: row.keyword } }} className="font-medium hover:text-accent hover:underline">
          {row.keyword}
        </Link>
        {row.scoredAt && (
          <p className="text-[11px] text-muted-foreground">dinilai {formatRelativeDays(daysBetween(new Date(), row.scoredAt))}</p>
        )}
      </td>
      <td className="py-2 pr-4">
        {editing ? (
          <Input
            autoFocus
            defaultValue={row.tags.join(", ")}
            className="h-7 w-40 text-xs"
            onBlur={(event) => saveTags(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && saveTags(event.currentTarget.value)}
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="flex flex-wrap gap-1 text-left">
            {row.tags.length > 0 ? row.tags.map((tag) => <Badge key={tag}>{tag}</Badge>) : <Badge>+ tag</Badge>}
          </button>
        )}
      </td>
      {ASSET_TYPES.map((type) => (
        <td key={type} className="py-2 pr-4 text-right tabular-nums">
          {row.scores?.[type] ?? "–"}
        </td>
      ))}
      <td className="py-2 pr-4">
        {row.bestAssetType && isAssetType(row.bestAssetType) ? (
          <Badge tone="success">
            {ASSET_TYPE_META[row.bestAssetType].label} {row.bestScore}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Butuh data persaingan</span>
        )}
      </td>
      <td className="py-2">
        <span className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Hitung ulang skor"
            disabled={pending}
            onClick={() => startTransition(() => refreshScoreAction(row.keyword))}
          >
            <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            aria-label="Hapus"
            disabled={pending}
            onClick={() => startTransition(() => removeKeywordAction(row.id))}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </span>
      </td>
    </tr>
  );
}
