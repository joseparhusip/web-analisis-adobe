import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchForm({ defaultValue, className, autoFocus }: SearchFormProps) {
  return (
    <form action="/research" className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder="Tema atau keyword, contoh: ramadan background"
          className="pl-9"
          required
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </div>
      <Button type="submit">Riset</Button>
    </form>
  );
}
