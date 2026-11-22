"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useActionState } from "react";
import { type ActionState, saveKeywordAction } from "@/app/(main)/research/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SaveKeywordFormProps {
  keyword: string;
  savedTags?: string[];
}

export function SaveKeywordForm({ keyword, savedTags }: SaveKeywordFormProps) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(saveKeywordAction, null);
  const isSaved = savedTags !== undefined;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="keyword" value={keyword} />
      <Input name="tags" defaultValue={savedTags?.join(", ")} placeholder="Tag, pisahkan koma" className="h-9 w-56" />
      <Button type="submit" size="sm" className="h-9" disabled={pending}>
        {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        {isSaved ? "Perbarui" : "Simpan"}
      </Button>
      {state && <span className={state.ok ? "text-xs text-success" : "text-xs text-danger"}>{state.message}</span>}
    </form>
  );
}
