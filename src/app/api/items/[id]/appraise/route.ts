import { NextResponse } from "next/server";
import { getItem, getSettings, patchItem, appendLedger } from "@/lib/store";
import { appraise } from "@/lib/ai/engine";
import { AIUnavailable } from "@/lib/ai/client";
import { roundPrice, reserveFrom } from "@/lib/policy";
import { currentSlug } from "@/lib/session";
import { band } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  const slug = body.slug || (await currentSlug());
  if (!slug) return NextResponse.json({ error: "no shop" }, { status: 400 });
  const item = await getItem(slug, id);
  if (!item) return NextResponse.json({ error: "no item" }, { status: 404 });
  if (item.prohibited) return NextResponse.json({ item });

  try {
    const settings = await getSettings(slug);
    const a = await appraise(item);
    const price = roundPrice(a.low + (a.high - a.low) * 0.6, settings.rounding);
    const reserve = reserveFrom(a.low, settings);
    const patched = await patchItem(slug, id, {
      priceLow: a.low,
      priceHigh: a.high,
      why: a.why,
      comps: a.comps,
      price,
      reserve,
      status: "appraised",
    });
    await appendLedger(slug, {
      ts: Date.now(), actor: "squirrel", action: "appraised",
      item: `band ${band(a.low, a.high)}`, itemId: id, amount: null, kind: "price",
      meta: { compsLive: a.compsLive, confidence: a.confidence },
    });
    return NextResponse.json({ item: patched, compsLive: a.compsLive });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "ai_unavailable", message: e.message }, { status: 503 });
    return NextResponse.json({ error: "appraise_failed", message: String((e as Error).message) }, { status: 500 });
  }
}
