"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function Dropdown({ value, options, onChange, className, ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-full items-center justify-between gap-3 rounded-lg border bg-card py-2 pl-3 pr-2.5 text-sm transition hover:bg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <span className="truncate">{current?.label ?? "Pilih"}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      <div
        role="listbox"
        className={cn(
          "absolute right-0 z-30 mt-2 max-h-72 min-w-full origin-top overflow-auto rounded-xl border bg-card p-1 shadow-lg transition duration-150 ease-out",
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0",
        )}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition",
                selected ? "bg-accent-soft font-medium text-accent" : "hover:bg-muted",
              )}
            >
              <span className="truncate">{option.label}</span>
              {selected && <Check className="size-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
