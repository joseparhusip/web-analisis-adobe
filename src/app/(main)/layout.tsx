import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ensureDefaultWorkspace } from "@/lib/workspace/context";

export default async function MainLayout({ children }: { children: ReactNode }) {
  await ensureDefaultWorkspace();
  return <AppShell>{children}</AppShell>;
}
