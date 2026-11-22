import { cn } from "@/lib/utils";

interface MeterProps {
  label: string;
  value: number | null;
  inverse?: boolean;
}

function tone(value: number, inverse: boolean): string {
  const effective = inverse ? 100 - value : value;
  if (effective >= 55) return "bg-success";
  if (effective >= 35) return "bg-warning";
  return "bg-danger";
}

export function Meter({ label, value, inverse = false }: MeterProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value ?? "–"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        {value !== null && <div className={cn("h-full rounded-full", tone(value, inverse))} style={{ width: `${value}%` }} />}
      </div>
    </div>
  );
}
