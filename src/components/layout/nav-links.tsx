"use client";

import { CalendarDays, Database, ImageUp, LayoutDashboard, ScanSearch, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/research", label: "Riset Keyword", icon: Search },
  { href: "/scan", label: "Scan Massal", icon: ScanSearch },
  { href: "/asset", label: "Analisis Aset", icon: ImageUp },
  { href: "/calendar", label: "Kalender Tema", icon: CalendarDays },
  { href: "/keywords", label: "Database Keyword", icon: Database },
  { href: "/settings", label: "Pengaturan", icon: Settings },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition",
            isActive(href) ? "bg-accent-soft font-medium text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
