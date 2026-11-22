import { NextResponse } from "next/server";
import { z } from "zod";
import { getExtensionStatus, recordExtensionProblem, recordExtensionSeen } from "@/lib/adobe/extension-status";
import { getAdobeKeywordData } from "@/lib/adobe/observations";
import { DEFAULT_WORKSPACE, runWithWorkspace, sanitizeSlug } from "@/lib/workspace/context";

const reportSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("heartbeat"), workspace: z.string().optional() }),
  z.object({ kind: z.literal("problem"), workspace: z.string().optional(), url: z.url(), detail: z.string().max(4000) }),
]);

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword") ?? "";
  const [{ totals, bestSellers }, extension] = await Promise.all([getAdobeKeywordData(keyword), getExtensionStatus()]);
  const timestamps = [...Object.values(totals), ...Object.values(bestSellers)].map((entry) => entry.observedAt.getTime());
  return NextResponse.json({
    latestObservedAt: timestamps.length > 0 ? Math.max(...timestamps) : null,
    extensionSeenAt: extension.lastSeenAt ?? null,
  });
}

export async function POST(request: Request) {
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });

  const workspace = sanitizeSlug(parsed.data.workspace) ?? DEFAULT_WORKSPACE;
  return runWithWorkspace(workspace, async () => {
    if (parsed.data.kind === "problem") await recordExtensionProblem(parsed.data.url, parsed.data.detail);
    else await recordExtensionSeen();
    return NextResponse.json({ ok: true });
  });
}
