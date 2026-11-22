import { peekCache, writeCache } from "@/lib/cache";
import { currentWorkspaceId } from "@/lib/workspace/context";

export interface ExtensionProblem {
  url: string;
  detail: string;
  reportedAt: string;
}

export interface ExtensionStatus {
  lastSeenAt?: string;
  lastCapturedAt?: string;
  problem?: ExtensionProblem;
}

const cacheKey = async () => `adobe:${await currentWorkspaceId()}:extension-status`;

export async function getExtensionStatus(): Promise<ExtensionStatus> {
  return (await peekCache<ExtensionStatus>(await cacheKey()))?.value ?? {};
}

async function update(patch: (current: ExtensionStatus) => ExtensionStatus): Promise<void> {
  await writeCache(await cacheKey(), patch(await getExtensionStatus()));
}

export function recordExtensionSeen(): Promise<void> {
  return update((current) => ({ ...current, lastSeenAt: new Date().toISOString() }));
}

export function recordExtensionCapture(): Promise<void> {
  const now = new Date().toISOString();
  return update(() => ({ lastSeenAt: now, lastCapturedAt: now }));
}

export function recordExtensionProblem(url: string, detail: string): Promise<void> {
  const now = new Date().toISOString();
  return update((current) => ({ ...current, lastSeenAt: now, problem: { url, detail, reportedAt: now } }));
}
