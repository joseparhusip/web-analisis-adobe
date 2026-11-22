import { AsyncLocalStorage } from "node:async_hooks";
import { cookies } from "next/headers";
import { eq, like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { adobeObservations, appSettings, savedKeywords, sourceCache, type Workspace, workspaces } from "@/lib/db/schema";

export const DEFAULT_WORKSPACE = "default";
export const WORKSPACE_COOKIE = "workspace";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

const store = new AsyncLocalStorage<string>();

export function runWithWorkspace<T>(workspaceId: string, fn: () => T): T {
  return store.run(sanitizeSlug(workspaceId) ?? DEFAULT_WORKSPACE, fn);
}

export function sanitizeSlug(value: string | undefined | null): string | undefined {
  const slug = value?.trim().toLowerCase();
  return slug && SLUG_PATTERN.test(slug) ? slug : undefined;
}

export function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return SLUG_PATTERN.test(slug) ? slug : `ws-${Date.now().toString(36)}`;
}

export async function currentWorkspaceId(): Promise<string> {
  const override = store.getStore();
  if (override) return override;
  try {
    const jar = await cookies();
    return sanitizeSlug(jar.get(WORKSPACE_COOKIE)?.value) ?? DEFAULT_WORKSPACE;
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = await getDb();
  const rows = await db.select().from(workspaces);
  return rows.sort((a, b) => {
    if (a.id === DEFAULT_WORKSPACE) return -1;
    if (b.id === DEFAULT_WORKSPACE) return 1;
    return a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export async function reorderWorkspaces(orderedIds: readonly string[]): Promise<void> {
  const db = await getDb();
  await Promise.all(
    orderedIds
      .map((id) => sanitizeSlug(id))
      .filter((id): id is string => id !== undefined && !isProtectedWorkspace(id))
      .map((id, index) => db.update(workspaces).set({ position: index }).where(eq(workspaces.id, id))),
  );
}

export async function workspaceExists(id: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return row !== undefined;
}

export async function ensureDefaultWorkspace(): Promise<void> {
  const db = await getDb();
  await db
    .insert(workspaces)
    .values({ id: DEFAULT_WORKSPACE, name: "Workspace Utama", createdAt: new Date() })
    .onConflictDoNothing();
}

export function isProtectedWorkspace(id: string): boolean {
  return id === DEFAULT_WORKSPACE;
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed || isProtectedWorkspace(id)) return;
  const db = await getDb();
  await db.update(workspaces).set({ name: trimmed }).where(eq(workspaces.id, id));
}

export async function deleteWorkspace(id: string): Promise<void> {
  if (isProtectedWorkspace(id)) return;
  const db = await getDb();
  await db.delete(savedKeywords).where(eq(savedKeywords.workspaceId, id));
  await db.delete(adobeObservations).where(eq(adobeObservations.workspaceId, id));
  await db.delete(appSettings).where(eq(appSettings.id, id));
  await db.delete(sourceCache).where(like(sourceCache.key, `brief:${id}:%`));
  await db.delete(sourceCache).where(like(sourceCache.key, `niches:${id}:%`));
  await db.delete(sourceCache).where(eq(sourceCache.key, `adobe:${id}:extension-status`));
  await db.delete(workspaces).where(eq(workspaces.id, id));
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const db = await getDb();
  const trimmed = name.trim().slice(0, 60) || "Workspace";
  let id = slugify(trimmed);
  for (let suffix = 2; await workspaceExists(id); suffix += 1) id = `${slugify(trimmed)}-${suffix}`;

  const workspace = { id, name: trimmed, position: Date.now(), createdAt: new Date() };
  await db.insert(workspaces).values(workspace);
  return workspace;
}
