"use client";

import { Check, ChevronsUpDown, GripVertical, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  logoutAction,
  renameWorkspaceAction,
  reorderWorkspacesAction,
  switchWorkspaceAction,
} from "@/lib/workspace/actions";
import { cn } from "@/lib/utils";

export interface WorkspaceOption {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceOption[];
  currentId: string;
  defaultId: string;
  showLogout: boolean;
}

type RowMode = { id: string; action: "edit" | "delete" } | null;

function reorder(list: WorkspaceOption[], fromId: string, toId: string): WorkspaceOption[] {
  const from = list.findIndex((item) => item.id === fromId);
  const to = list.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

export function WorkspaceSwitcher({ workspaces, currentId, defaultId, showLogout }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [row, setRow] = useState<RowMode>(null);
  const [items, setItems] = useState(() => workspaces.filter((workspace) => workspace.id !== defaultId));
  const dragId = useRef<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const defaultWorkspace = workspaces.find((workspace) => workspace.id === defaultId);
  const current = workspaces.find((workspace) => workspace.id === currentId);
  const signature = workspaces.map((workspace) => `${workspace.id}:${workspace.name}`).join(",");

  useEffect(() => {
    setItems(workspaces.filter((workspace) => workspace.id !== defaultId));
  }, [signature, defaultId, workspaces]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const persistOrder = () => {
    dragId.current = null;
    void reorderWorkspacesAction(items.map((item) => item.id));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition hover:bg-muted"
      >
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Workspace</span>
          <span className="block truncate font-medium">{current?.name ?? "Pilih"}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <div
        className={cn(
          "absolute bottom-full left-0 z-30 mb-2 w-full origin-bottom rounded-xl border bg-card p-1 shadow-lg transition duration-150",
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-1 scale-95 opacity-0",
        )}
      >
        {defaultWorkspace && (
          <SwitchButton workspace={defaultWorkspace} active={defaultWorkspace.id === currentId} className="pl-2.5" />
        )}

        {items.map((workspace) => {
          if (row?.id === workspace.id && row.action === "edit") {
            return <RenameRow key={workspace.id} workspace={workspace} onCancel={() => setRow(null)} />;
          }
          if (row?.id === workspace.id && row.action === "delete") {
            return <DeleteRow key={workspace.id} workspace={workspace} onCancel={() => setRow(null)} />;
          }
          return (
            <div
              key={workspace.id}
              draggable={items.length > 1}
              onDragStart={() => (dragId.current = workspace.id)}
              onDragOver={(event) => {
                event.preventDefault();
                const dragging = dragId.current;
                if (dragging && dragging !== workspace.id) setItems((prev) => reorder(prev, dragging, workspace.id));
              }}
              onDragEnd={persistOrder}
              onDrop={persistOrder}
              className={cn("group flex items-center gap-0.5", dragId.current === workspace.id && "opacity-50")}
            >
              {items.length > 1 && (
                <span className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden>
                  <GripVertical className="size-3.5" />
                </span>
              )}
              <SwitchButton workspace={workspace} active={workspace.id === currentId} className="flex-1" />
              <IconButton label="Ganti nama" onClick={() => setRow({ id: workspace.id, action: "edit" })}>
                <Pencil className="size-3.5" />
              </IconButton>
              {items.length > 1 && (
                <IconButton label="Hapus" danger onClick={() => setRow({ id: workspace.id, action: "delete" })}>
                  <Trash2 className="size-3.5" />
                </IconButton>
              )}
            </div>
          );
        })}

        <div className="my-1 border-t" />

        {creating ? (
          <form action={createWorkspaceAction} className="p-1">
            <input
              name="name"
              autoFocus
              required
              maxLength={60}
              placeholder="Nama workspace"
              className="mb-1 h-8 w-full rounded-md border bg-card px-2 text-sm outline-none focus:border-accent"
            />
            <div className="flex gap-1">
              <button type="submit" className="flex-1 rounded-md bg-accent px-2 py-1.5 text-xs font-medium text-accent-foreground">
                Buat
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-md border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-4" />
            Workspace baru
          </button>
        )}

        {showLogout && (
          <>
            <div className="my-1 border-t" />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function SwitchButton({ workspace, active, className }: { workspace: WorkspaceOption; active: boolean; className?: string }) {
  return (
    <form action={switchWorkspaceAction} className={cn("min-w-0", className)}>
      <input type="hidden" name="workspace" value={workspace.id} />
      <button
        type="submit"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
          active ? "bg-accent-soft font-medium text-accent" : "hover:bg-muted",
        )}
      >
        <span className="truncate">{workspace.name}</span>
        {active && <Check className="size-4 shrink-0" />}
      </button>
    </form>
  );
}

function RenameRow({ workspace, onCancel }: { workspace: WorkspaceOption; onCancel: () => void }) {
  return (
    <form action={renameWorkspaceAction} className="flex items-center gap-1 p-1">
      <input type="hidden" name="workspace" value={workspace.id} />
      <input
        name="name"
        autoFocus
        required
        maxLength={60}
        defaultValue={workspace.name}
        className="h-8 min-w-0 flex-1 rounded-md border bg-card px-2 text-sm outline-none focus:border-accent"
      />
      <IconButton label="Simpan" submit>
        <Check className="size-3.5" />
      </IconButton>
      <IconButton label="Batal" onClick={onCancel}>
        <X className="size-3.5" />
      </IconButton>
    </form>
  );
}

function DeleteRow({ workspace, onCancel }: { workspace: WorkspaceOption; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-danger-soft p-1.5">
      <span className="min-w-0 flex-1 truncate px-1 text-xs text-danger">Hapus “{workspace.name}” & datanya?</span>
      <form action={deleteWorkspaceAction}>
        <input type="hidden" name="workspace" value={workspace.id} />
        <button type="submit" className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white">
          Hapus
        </button>
      </form>
      <IconButton label="Batal" onClick={onCancel}>
        <X className="size-3.5" />
      </IconButton>
    </div>
  );
}

interface IconButtonProps {
  label: string;
  danger?: boolean;
  submit?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function IconButton({ label, danger, submit, onClick, children }: IconButtonProps) {
  return (
    <button
      type={submit ? "submit" : "button"}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted",
        danger ? "hover:text-danger" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
