import { NextResponse } from "next/server";
import { resolveAI, QWEN_STACK } from "@/lib/config";
import { compsEnabled, publishEnabled } from "@/lib/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ai = resolveAI();
  return NextResponse.json({
    ok: true,
    ai: { provider: ai.provider, label: ai.label, ready: ai.provider !== "none" },
    comps: { live: compsEnabled() },
    ebayPublish: { enabled: publishEnabled() },
    stack: QWEN_STACK,
  });
}
