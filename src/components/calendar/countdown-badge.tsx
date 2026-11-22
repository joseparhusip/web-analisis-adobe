import type { UploadStatus } from "@/lib/calendar/schedule";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./status";

export function CountdownBadge({ days, status }: { days: number; status: UploadStatus }) {
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", STATUS_CONFIG[status].chip)}>
      <span className="text-sm font-bold leading-none tabular-nums">{Math.abs(days)}</span>
      <span className="mt-0.5 text-[9px] font-medium uppercase leading-none opacity-70">hari</span>
    </span>
  );
}
