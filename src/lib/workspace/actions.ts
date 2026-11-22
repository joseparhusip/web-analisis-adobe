"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { DAY } from "@/lib/time";
import {
  createWorkspace,
  DEFAULT_WORKSPACE,
  deleteWorkspace,
  isProtectedWorkspace,
  listWorkspaces,
  renameWorkspace,
  reorderWorkspaces,
  sanitizeSlug,
  WORKSPACE_COOKIE,
  workspaceExists,
} from "./context";

async function setWorkspaceCookie(id: string): Promise<void> {
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: (365 * DAY) / 1000,
  });
}

export async function switchWorkspaceAction(formData: FormData): Promise<void> {
  const id = sanitizeSlug(String(formData.get("workspace") ?? ""));
  if (id && (await workspaceExists(id))) await setWorkspaceCookie(id);
  redirect("/");
}

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/");
  const workspace = await createWorkspace(name);
  await setWorkspaceCookie(workspace.id);
  redirect("/");
}

export async function renameWorkspaceAction(formData: FormData): Promise<void> {
  const id = sanitizeSlug(String(formData.get("workspace") ?? ""));
  const name = String(formData.get("name") ?? "");
  if (id && (await workspaceExists(id))) await renameWorkspace(id, name);
  redirect("/");
}

export async function deleteWorkspaceAction(formData: FormData): Promise<void> {
  const id = sanitizeSlug(String(formData.get("workspace") ?? ""));
  if (id && !isProtectedWorkspace(id) && (await listWorkspaces()).length > 1) {
    await deleteWorkspace(id);
    const jar = await cookies();
    if (jar.get(WORKSPACE_COOKIE)?.value === id) await setWorkspaceCookie(DEFAULT_WORKSPACE);
  }
  redirect("/");
}

export async function reorderWorkspacesAction(orderedIds: string[]): Promise<void> {
  await reorderWorkspaces(orderedIds);
  revalidatePath("/", "layout");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
