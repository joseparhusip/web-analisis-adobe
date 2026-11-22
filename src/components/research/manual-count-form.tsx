"use client";

import { useActionState } from "react";
import { type ActionState, recordManualCountAction } from "@/app/(main)/research/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssetType } from "@/lib/asset-types";

interface ManualCountFormProps {
  keyword: string;
  assetType: AssetType;
}

export function ManualCountForm({ keyword, assetType }: ManualCountFormProps) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(recordManualCountAction, null);

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="keyword" value={keyword} />
      <input type="hidden" name="assetType" value={assetType} />
      <div className="flex gap-1.5">
        <Input name="total" inputMode="numeric" placeholder="Jumlah hasil di Adobe" className="h-8 text-xs" required />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          Isi
        </Button>
      </div>
      {state && !state.ok && <p className="text-[11px] text-danger">{state.message}</p>}
    </form>
  );
}
