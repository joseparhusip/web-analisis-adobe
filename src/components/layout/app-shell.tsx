import { Telescope } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { isGateEnabled } from "@/lib/auth/session";
import { currentWorkspaceId, DEFAULT_WORKSPACE, listWorkspaces } from "@/lib/workspace/context";
import { NavLinks } from "./nav-links";
import { WorkspaceSwitcher } from "./workspace-switcher";

export async function AppShell({ children }: { children: ReactNode }) {
  const [workspaces, currentId] = await Promise.all([listWorkspaces(), currentWorkspaceId()]);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 z-10 border-b bg-card/80 px-4 py-3 backdrop-blur md:flex md:h-dvh md:flex-col md:border-r md:border-b-0 md:px-3 md:py-5">
        <Link href="/" className="mb-3 flex items-center gap-2 px-3 font-semibold md:mb-6">
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Telescope className="size-4" />
          </span>
          Stock Research
        </Link>
        <NavLinks />
        <div className="mt-4 md:mt-auto md:pt-4">
          <WorkspaceSwitcher
            workspaces={workspaces.map(({ id, name }) => ({ id, name }))}
            currentId={currentId}
            defaultId={DEFAULT_WORKSPACE}
            showLogout={isGateEnabled()}
          />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
