import { refreshSavedKeywordScore } from "@/lib/keywords/refresh";
import { listSavedKeywords } from "@/lib/keywords/repository";
import { HOUR } from "@/lib/time";
import { listWorkspaces, runWithWorkspace } from "@/lib/workspace/context";

const STALE_AFTER_MS = 12 * HOUR;
const CYCLE_INTERVAL_MS = 6 * HOUR;
const runOnce = process.argv.includes("--once");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function refreshWorkspace(workspaceId: string): Promise<void> {
  const threshold = Date.now() - STALE_AFTER_MS;
  const stale = (await listSavedKeywords()).filter((row) => !row.scoredAt || row.scoredAt.getTime() < threshold);
  console.log(`[worker] [${workspaceId}] ${stale.length} keyword perlu diperbarui`);

  for (const { keyword } of stale) {
    try {
      await refreshSavedKeywordScore(keyword);
      console.log(`[worker] [${workspaceId}] ✓ ${keyword}`);
    } catch (error) {
      console.error(`[worker] [${workspaceId}] ✗ ${keyword}`, error);
    }
  }
}

async function refreshStaleKeywords(): Promise<void> {
  const workspaces = await listWorkspaces();
  for (const workspace of workspaces) {
    await runWithWorkspace(workspace.id, () => refreshWorkspace(workspace.id));
  }
}

async function main(): Promise<void> {
  do {
    await refreshStaleKeywords();
    if (!runOnce) await sleep(CYCLE_INTERVAL_MS);
  } while (!runOnce);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
