import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NoticeTone = "info" | "warning" | "danger" | "success";

const TONES: Record<NoticeTone, { wrap: string; icon: string; title: string; Icon: ComponentType<{ className?: string }> }> = {
  info: { wrap: "border-accent/30 bg-accent-soft", icon: "text-accent", title: "text-accent", Icon: Info },
  warning: { wrap: "border-warning/30 bg-warning-soft", icon: "text-warning", title: "text-warning", Icon: AlertTriangle },
  danger: { wrap: "border-danger/30 bg-danger-soft", icon: "text-danger", title: "text-danger", Icon: XCircle },
  success: { wrap: "border-success/30 bg-success-soft", icon: "text-success", title: "text-success", Icon: CheckCircle2 },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}

export function Notice({ tone = "info", title, children, action }: NoticeProps) {
  const { wrap, icon, title: titleColor, Icon } = TONES[tone];

  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5", wrap)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", icon)} />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className={cn("font-semibold", titleColor)}>{title}</p>}
        {children && <div className={cn("text-foreground/80", title && "mt-0.5")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
