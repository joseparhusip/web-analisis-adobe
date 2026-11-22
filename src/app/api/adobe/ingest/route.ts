import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordExtensionCapture, recordExtensionProblem } from "@/lib/adobe/extension-status";
import { recordObservation } from "@/lib/adobe/observations";
import { parseAdobeSearchUrl } from "@/lib/adobe/search-url";
import { refreshSavedKeywordScore } from "@/lib/keywords/refresh";
import { DEFAULT_WORKSPACE, runWithWorkspace, sanitizeSlug } from "@/lib/workspace/context";

const MAX_SAMPLES = 120;

const payloadSchema = z.object({
  workspace: z.string().optional(),
  url: z.url(),
  total: z.number().int().nonnegative(),
  samples: z
    .array(
      z.object({
        id: z.string().min(1).max(32),
        title: z.string().max(300),
        pageUrl: z.url(),
        thumbnailUrl: z.url().optional(),
      }),
    )
    .max(MAX_SAMPLES)
    .default([]),
});

function sourceUrl(body: unknown): string {
  const url = (body as { url?: unknown } | null)?.url;
  return typeof url === "string" && URL.canParse(url) ? url : "https://stock.adobe.com/";
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  const workspace = sanitizeSlug((body as { workspace?: string } | null)?.workspace) ?? DEFAULT_WORKSPACE;

  return runWithWorkspace(workspace, async () => {
    if (!parsed.success) {
      const reason = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      await recordExtensionProblem(sourceUrl(body), `Kiriman ditolak: ${reason}`.slice(0, 2000));
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const context = parseAdobeSearchUrl(parsed.data.url);
    if ("error" in context) {
      await recordExtensionProblem(parsed.data.url, `Kiriman ditolak: ${context.error}`);
      return NextResponse.json({ error: context.error }, { status: 422 });
    }

    await recordObservation({ ...context, total: parsed.data.total, samples: parsed.data.samples, source: "extension" });
    await recordExtensionCapture();
    await refreshSavedKeywordScore(context.keyword);
    revalidatePath("/research");

    return NextResponse.json({ keyword: context.keyword, assetType: context.assetType, total: parsed.data.total });
  });
}
